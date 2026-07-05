"use client";

import { useState, useTransition } from "react";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createTask, deleteTask, toggleTaskComplete } from "@/server/actions/tasks";
import type { getTasks } from "@/server/data/tasks";

type Task = Awaited<ReturnType<typeof getTasks>>[number];

const priorityVariant: Record<string, "secondary" | "outline" | "destructive"> = {
  low: "outline",
  medium: "secondary",
  high: "destructive",
};

function SubtaskAdd({ parentTaskId }: { parentTaskId: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button
        variant="ghost"
        size="xs"
        className="text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Plus /> Subtask
      </Button>
    );
  }

  return (
    <form
      className="flex items-center gap-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        startTransition(async () => {
          try {
            await createTask({ parentTaskId, title, priority: "medium" });
            setTitle("");
            setOpen(false);
          } catch {
            toast.error("Couldn't add subtask.");
          }
        });
      }}
    >
      <Input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Subtask title…"
        className="h-7 w-48"
      />
      <Button type="submit" size="xs" disabled={isPending}>
        Add
      </Button>
    </form>
  );
}

function TaskRow({ task, depth = 0 }: { task: Task; depth?: number }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div>
      <div
        className="group flex items-center gap-2.5 py-1.5"
        style={{ paddingLeft: depth * 24 }}
      >
        <Checkbox
          checked={task.completed}
          disabled={isPending}
          aria-label={`${task.title} — done`}
          onCheckedChange={() => {
            startTransition(async () => {
              try {
                await toggleTaskComplete(task.id);
              } catch {
                toast.error("Couldn't update task.");
              }
            });
          }}
        />
        <span
          className={
            task.completed ? "flex-1 text-sm line-through text-muted-foreground" : "flex-1 text-sm"
          }
        >
          {task.title}
        </span>
        {task.project && (
          <Badge variant="outline">{task.project.name}</Badge>
        )}
        {task.tags?.map((tag) => (
          <Badge key={tag} variant="secondary">
            #{tag}
          </Badge>
        ))}
        {task.dueDate && (
          <span className="text-xs text-muted-foreground">{task.dueDate}</span>
        )}
        <Badge variant={priorityVariant[task.priority]}>{task.priority}</Badge>
        <Button
          variant="ghost"
          size="icon-xs"
          className="opacity-0 group-hover:opacity-100"
          onClick={() => {
            startTransition(async () => {
              try {
                await deleteTask(task.id);
              } catch {
                toast.error("Couldn't delete task.");
              }
            });
          }}
        >
          <Trash2 />
        </Button>
      </div>
      <div style={{ paddingLeft: (depth + 1) * 24 }}>
        {task.subtasks?.map((subtask) => (
          <TaskRow key={subtask.id} task={subtask as Task} depth={0} />
        ))}
        <SubtaskAdd parentTaskId={task.id} />
      </div>
    </div>
  );
}

export function TaskList({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Nothing here — enjoy the quiet.
      </p>
    );
  }

  return (
    <div className="divide-y">
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} />
      ))}
    </div>
  );
}
