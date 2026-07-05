import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { getProjects } from "@/server/data/tasks";

type Project = Awaited<ReturnType<typeof getProjects>>[number];

export function PersonalProjects({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No personal projects yet.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Link key={project.id} href={`/tasks?projectId=${project.id}`}>
          <Card className="h-full transition-colors hover:bg-muted/40">
            <CardHeader>
              <CardTitle className="text-base">{project.name}</CardTitle>
              {project.description && (
                <CardDescription>{project.description}</CardDescription>
              )}
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
