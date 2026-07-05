import { z } from "zod";

export const habitRecurrenceSchema = z.enum(["daily", "weekly", "monthly"]);

export const createHabitSchema = z
  .object({
    name: z.string().min(1, { error: "Name is required." }).max(200).trim(),
    category: z.string().max(100).trim().optional(),
    recurrence: habitRecurrenceSchema,
    daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
    dayOfMonth: z.number().int().min(1).max(31).optional(),
  })
  .refine(
    (data) =>
      data.recurrence !== "weekly" ||
      (data.daysOfWeek && data.daysOfWeek.length > 0),
    { error: "Pick at least one day of the week.", path: ["daysOfWeek"] }
  )
  .refine(
    (data) => data.recurrence !== "monthly" || data.dayOfMonth !== undefined,
    { error: "Pick a day of the month.", path: ["dayOfMonth"] }
  );

export const checkInSchema = z.object({
  habitId: z.uuid(),
  date: z.iso.date(),
});

export type CreateHabitInput = z.infer<typeof createHabitSchema>;
export type CheckInInput = z.infer<typeof checkInSchema>;
