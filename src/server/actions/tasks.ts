"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { requireSession } from "@/server/auth/dal";
import { db } from "@/server/db/client";
import { projects, taggables, tags, tasks } from "@/server/db/schema";
import {
  createProjectSchema,
  createTaskSchema,
  updateProjectStatusSchema,
  updateTaskSchema,
  type CreateProjectInput,
  type CreateTaskInput,
  type UpdateTaskInput,
} from "@/lib/validation/tasks";

export async function createProject(input: CreateProjectInput) {
  const session = await requireSession();
  const parsed = createProjectSchema.parse(input);

  await db.insert(projects).values({
    userId: session.user.id,
    type: parsed.type,
    name: parsed.name,
    description: parsed.description,
  });

  revalidatePath("/tasks");
}

export async function updateProjectStatus(input: {
  projectId: string;
  status: string;
}) {
  const session = await requireSession();
  const parsed = updateProjectStatusSchema.parse(input);

  await db
    .update(projects)
    .set({ status: parsed.status, updatedAt: new Date() })
    .where(
      and(eq(projects.id, parsed.projectId), eq(projects.userId, session.user.id))
    );

  revalidatePath("/tasks");
}

async function resolveTagIds(userId: string, tagNames: string[]) {
  const ids: string[] = [];
  for (const rawName of tagNames) {
    const name = rawName.trim().toLowerCase();
    if (!name) continue;

    const [existing] = await db
      .select({ id: tags.id })
      .from(tags)
      .where(and(eq(tags.userId, userId), eq(tags.name, name)))
      .limit(1);

    if (existing) {
      ids.push(existing.id);
    } else {
      const [created] = await db
        .insert(tags)
        .values({ userId, name })
        .returning({ id: tags.id });
      ids.push(created.id);
    }
  }
  return ids;
}

export async function createTask(input: CreateTaskInput) {
  const session = await requireSession();
  const parsed = createTaskSchema.parse(input);

  const [task] = await db
    .insert(tasks)
    .values({
      userId: session.user.id,
      projectId: parsed.projectId,
      parentTaskId: parsed.parentTaskId,
      title: parsed.title,
      dueDate: parsed.dueDate,
      priority: parsed.priority,
    })
    .returning({ id: tasks.id });

  if (parsed.tags && parsed.tags.length > 0) {
    const tagIds = await resolveTagIds(session.user.id, parsed.tags);
    if (tagIds.length > 0) {
      await db.insert(taggables).values(
        tagIds.map((tagId) => ({
          tagId,
          entityType: "task" as const,
          entityId: task.id,
        }))
      );
    }
  }

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function toggleTaskComplete(taskId: string) {
  const session = await requireSession();

  const [task] = await db
    .select({ completed: tasks.completed })
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, session.user.id)))
    .limit(1);
  if (!task) return;

  await db
    .update(tasks)
    .set({
      completed: !task.completed,
      completedAt: !task.completed ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, session.user.id)));

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function updateTask(input: UpdateTaskInput) {
  const session = await requireSession();
  const parsed = updateTaskSchema.parse(input);
  const { taskId, ...rest } = parsed;

  await db
    .update(tasks)
    .set({ ...rest, updatedAt: new Date() })
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, session.user.id)));

  revalidatePath("/tasks");
}

export async function deleteTask(taskId: string) {
  const session = await requireSession();
  await db
    .delete(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, session.user.id)));

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}
