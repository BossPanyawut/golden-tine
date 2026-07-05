import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskQuickAdd } from "./task-quick-add";
import { TaskList } from "./task-list";
import { WorkKanban } from "./work-kanban";
import { PersonalProjects } from "./personal-projects";
import { NewProjectDialog } from "./new-project-dialog";
import type { getProjects, getTasks, TaskView } from "@/server/data/tasks";

type Project = Awaited<ReturnType<typeof getProjects>>[number];
type Task = Awaited<ReturnType<typeof getTasks>>[number];

const views: { id: TaskView; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "overdue", label: "Overdue" },
  { id: "all", label: "All" },
];

export function TasksView({
  workProjects,
  personalProjects,
  tasks,
  view,
  projectId,
}: {
  workProjects: Project[];
  personalProjects: Project[];
  tasks: Task[];
  view: TaskView;
  projectId?: string;
}) {
  const allProjects = [...workProjects, ...personalProjects].map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
  }));

  return (
    <Tabs defaultValue="smart" className="gap-4">
      <TabsList>
        <TabsTrigger value="smart">Smart Views</TabsTrigger>
        <TabsTrigger value="work">Work Projects</TabsTrigger>
        <TabsTrigger value="personal">Personal Projects</TabsTrigger>
      </TabsList>

      <TabsContent value="smart" className="space-y-4">
        <TaskQuickAdd projects={allProjects} defaultProjectId={projectId} />
        <div className="flex flex-wrap items-center gap-2">
          {views.map((v) => (
            <Link
              key={v.id}
              href={`/tasks?view=${v.id}`}
              className={
                view === v.id && !projectId
                  ? "rounded-md bg-secondary px-3 py-1 text-sm font-medium"
                  : "rounded-md px-3 py-1 text-sm text-muted-foreground hover:bg-muted"
              }
            >
              {v.label}
            </Link>
          ))}
          {projectId && (
            <span className="rounded-md bg-secondary px-3 py-1 text-sm font-medium">
              Filtered by project —{" "}
              <Link href="/tasks" className="underline underline-offset-2">
                clear
              </Link>
            </span>
          )}
        </div>
        <TaskList tasks={tasks} />
      </TabsContent>

      <TabsContent value="work" className="space-y-3">
        <NewProjectDialog type="work" />
        <WorkKanban projects={workProjects} />
      </TabsContent>

      <TabsContent value="personal" className="space-y-3">
        <NewProjectDialog type="personal" />
        <PersonalProjects projects={personalProjects} />
      </TabsContent>
    </Tabs>
  );
}
