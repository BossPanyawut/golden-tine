"use client";

import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { updateProjectStatus } from "@/server/actions/tasks";
import type { getProjects } from "@/server/data/tasks";

type Project = Awaited<ReturnType<typeof getProjects>>[number];

const columns: { id: string; label: string }[] = [
  { id: "draft", label: "Draft" },
  { id: "review", label: "Review" },
  { id: "approved", label: "Approved" },
  { id: "done", label: "Done" },
];

function ProjectCard({ project }: { project: Project }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: project.id });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
        opacity: isDragging ? 0.4 : 1,
      }}
      className="cursor-grab touch-none rounded-md border bg-card p-3 text-sm shadow-sm active:cursor-grabbing"
    >
      <p className="font-medium">{project.name}</p>
      {project.description && (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {project.description}
        </p>
      )}
    </div>
  );
}

function Column({
  id,
  label,
  projects,
}: {
  id: string;
  label: string;
  projects: Project[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-40 flex-1 flex-col gap-2 rounded-lg border p-2 ${
        isOver ? "bg-muted/60" : ""
      }`}
    >
      <p className="px-1 text-xs font-medium text-muted-foreground">
        {label} · {projects.length}
      </p>
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}

export function WorkKanban({ projects }: { projects: Project[] }) {
  const [items, setItems] = useState(projects);
  // Resync local (optimistically-mutable) copy when the server gives us a
  // fresh `projects` prop — adjusting state during render, per React's
  // guidance, instead of an effect (https://react.dev/learn/you-might-not-need-an-effect).
  const [prevProjects, setPrevProjects] = useState(projects);
  if (projects !== prevProjects) {
    setPrevProjects(projects);
    setItems(projects);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const newStatus = over.id as Project["status"];
    const projectId = active.id as string;
    const previous = items;

    setItems((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, status: newStatus } : p))
    );

    updateProjectStatus({ projectId, status: newStatus }).catch(() => {
      toast.error("Couldn't move project — reverting.");
      setItems(previous);
    });
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto">
        {columns.map((col) => (
          <Column
            key={col.id}
            id={col.id}
            label={col.label}
            projects={items.filter((p) => p.status === col.id)}
          />
        ))}
      </div>
    </DndContext>
  );
}
