import { z } from "zod";

export const projectTypeSchema = z.enum(["work", "personal"]);
export const projectStatusSchema = z.enum([
  "draft",
  "review",
  "approved",
  "done",
]);
export const taskPrioritySchema = z.enum(["low", "medium", "high"]);

export const createProjectSchema = z.object({
  type: projectTypeSchema,
  name: z.string().min(1, { error: "Name is required." }).max(200).trim(),
  description: z.string().max(2000).trim().optional(),
});

export const updateProjectStatusSchema = z.object({
  projectId: z.uuid(),
  status: projectStatusSchema,
});

export const createTaskSchema = z.object({
  projectId: z.uuid().optional(),
  parentTaskId: z.uuid().optional(),
  title: z.string().min(1, { error: "Title is required." }).max(300).trim(),
  dueDate: z.iso.date().optional(),
  priority: taskPrioritySchema.default("medium"),
  tags: z.array(z.string().min(1).max(50)).max(20).optional(),
});

export const updateTaskSchema = z.object({
  taskId: z.uuid(),
  title: z.string().min(1).max(300).trim().optional(),
  dueDate: z.iso.date().nullable().optional(),
  priority: taskPrioritySchema.optional(),
  projectId: z.uuid().nullable().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type CreateTaskInput = z.output<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
