"use client";

import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTask } from "@/server/actions/tasks";

type ProjectOption = { id: string; name: string; type: "work" | "personal" };

// Native inputs produce plain strings (an empty date input is "", not
// undefined; tags is one comma-separated string, not string[]) — validate
// that raw shape here, then transform into the server's CreateTaskInput
// shape before calling the action. Keeps client validation forgiving of
// what HTML inputs actually emit while the server still enforces the
// stricter CreateTaskInput shape (ISO date, string[] tags).
const taskFormSchema = z.object({
  title: z.string().min(1, { error: "Title is required." }).max(300),
  dueDate: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  projectId: z.string().optional(),
  tags: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

export function TaskQuickAdd({
  projects,
  defaultProjectId,
}: {
  projects: ProjectOption[];
  defaultProjectId?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      priority: "medium",
      projectId: defaultProjectId ?? "none",
      dueDate: "",
      tags: "",
    },
  });

  const onSubmit = handleSubmit((data) => {
    startTransition(async () => {
      try {
        await createTask({
          title: data.title,
          priority: data.priority,
          dueDate: data.dueDate || undefined,
          projectId: data.projectId && data.projectId !== "none" ? data.projectId : undefined,
          tags: data.tags
            ? data.tags.split(",").map((t) => t.trim()).filter(Boolean)
            : undefined,
        });
        reset({
          title: "",
          priority: "medium",
          projectId: defaultProjectId ?? "none",
          dueDate: "",
          tags: "",
        });
      } catch {
        toast.error("Couldn't create task. Try again.");
      }
    });
  });

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-wrap items-start gap-2 rounded-lg border p-3"
    >
      <div className="min-w-48 flex-1">
        <Input placeholder="Add a task…" {...register("title")} />
        {errors.title && (
          <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>
      <Input type="date" className="w-40" {...register("dueDate")} />
      <Controller
        control={control}
        name="priority"
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        )}
      />
      <Controller
        control={control}
        name="projectId"
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="No project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No project</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.type === "work" ? "💼 " : "🌱 "}
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      <Input
        placeholder="tags, comma, separated"
        className="w-48"
        {...register("tags")}
      />
      <Button type="submit" disabled={isPending}>
        {isPending ? "Adding…" : "Add task"}
      </Button>
    </form>
  );
}
