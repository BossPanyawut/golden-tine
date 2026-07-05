import "server-only";
import { and, asc, eq, inArray, isNull, lt, sql } from "drizzle-orm";
import { format } from "date-fns";
import { db } from "@/server/db/client";
import { projects, tags, taggables, tasks } from "@/server/db/schema";
import { requireSession } from "@/server/auth/dal";

export async function getProjects(type?: "work" | "personal") {
  const session = await requireSession();
  return db.query.projects.findMany({
    where: type
      ? and(eq(projects.userId, session.user.id), eq(projects.type, type))
      : eq(projects.userId, session.user.id),
    orderBy: [asc(projects.createdAt)],
  });
}

export type TaskView = "today" | "overdue" | "all";

export async function getTasks(
  opts: { view?: TaskView; projectId?: string } = {}
) {
  const session = await requireSession();
  const { view = "all", projectId } = opts;
  const todayStr = format(new Date(), "yyyy-MM-dd");

  const conditions = [
    eq(tasks.userId, session.user.id),
    isNull(tasks.parentTaskId),
  ];
  if (projectId) conditions.push(eq(tasks.projectId, projectId));
  if (view === "today") conditions.push(eq(tasks.dueDate, todayStr));
  if (view === "overdue") {
    conditions.push(lt(tasks.dueDate, todayStr));
    conditions.push(eq(tasks.completed, false));
  }

  const rows = await db.query.tasks.findMany({
    where: and(...conditions),
    with: { subtasks: true, project: true },
    orderBy: [asc(tasks.dueDate), asc(tasks.createdAt)],
  });

  const tagsByTask = await getTagsForTasks(rows.map((t) => t.id));
  return rows.map((t) => ({ ...t, tags: tagsByTask.get(t.id) ?? [] }));
}

async function getTagsForTasks(taskIds: string[]) {
  const map = new Map<string, string[]>();
  if (taskIds.length === 0) return map;

  const rows = await db
    .select({ taskId: taggables.entityId, tagName: tags.name })
    .from(taggables)
    .innerJoin(tags, eq(tags.id, taggables.tagId))
    .where(
      and(eq(taggables.entityType, "task"), inArray(taggables.entityId, taskIds))
    );

  for (const row of rows) {
    const list = map.get(row.taskId) ?? [];
    list.push(row.tagName);
    map.set(row.taskId, list);
  }
  return map;
}

export async function getDashboardTaskSummary() {
  const session = await requireSession();
  const todayStr = format(new Date(), "yyyy-MM-dd");

  const [{ dueToday }] = await db
    .select({ dueToday: sql<number>`count(*)::int` })
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, session.user.id),
        eq(tasks.dueDate, todayStr),
        eq(tasks.completed, false)
      )
    );

  const [{ overdue }] = await db
    .select({ overdue: sql<number>`count(*)::int` })
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, session.user.id),
        lt(tasks.dueDate, todayStr),
        eq(tasks.completed, false)
      )
    );

  return { dueToday, overdue };
}
