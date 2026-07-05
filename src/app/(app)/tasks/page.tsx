import { getProjects, getTasks, type TaskView } from "@/server/data/tasks";
import { TasksView } from "./_components/tasks-view";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; projectId?: string }>;
}) {
  const params = await searchParams;
  const view: TaskView =
    params.view === "overdue" || params.view === "all" ? params.view : "today";
  const projectId = params.projectId;

  const [workProjects, personalProjects, tasks] = await Promise.all([
    getProjects("work"),
    getProjects("personal"),
    getTasks({ view: projectId ? "all" : view, projectId }),
  ]);

  return (
    <TasksView
      workProjects={workProjects}
      personalProjects={personalProjects}
      tasks={tasks}
      view={view}
      projectId={projectId}
    />
  );
}
