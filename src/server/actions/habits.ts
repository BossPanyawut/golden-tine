"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { requireSession } from "@/server/auth/dal";
import { db } from "@/server/db/client";
import { habitLogs, habits } from "@/server/db/schema";
import {
  checkInSchema,
  createHabitSchema,
  type CheckInInput,
  type CreateHabitInput,
} from "@/lib/validation/habits";
import { awardExp, reverseExp, syncProgress } from "@/server/services/progress";
import { HABIT_EXP } from "@/server/services/exp-engine";

export async function createHabit(input: CreateHabitInput) {
  const session = await requireSession();
  const parsed = createHabitSchema.parse(input);

  await db.insert(habits).values({
    userId: session.user.id,
    name: parsed.name,
    category: parsed.category,
    recurrence: parsed.recurrence,
    daysOfWeek: parsed.recurrence === "weekly" ? parsed.daysOfWeek : null,
    dayOfMonth: parsed.recurrence === "monthly" ? parsed.dayOfMonth : null,
  });

  revalidatePath("/habits");
  revalidatePath("/dashboard");
}

export async function checkInHabit(input: CheckInInput) {
  const session = await requireSession();
  const parsed = checkInSchema.parse(input);

  const [habit] = await db
    .select({ id: habits.id })
    .from(habits)
    .where(and(eq(habits.id, parsed.habitId), eq(habits.userId, session.user.id)))
    .limit(1);
  if (!habit) return;

  const [log] = await db
    .insert(habitLogs)
    .values({
      habitId: parsed.habitId,
      userId: session.user.id,
      date: parsed.date,
    })
    .onConflictDoNothing()
    .returning({ id: habitLogs.id });

  // Only award if a new log row was actually inserted (onConflictDoNothing
  // returns nothing when the check-in already existed).
  if (log) {
    await awardExp(session.user.id, "habit", HABIT_EXP, log.id);
  }

  revalidatePath("/habits");
  revalidatePath("/dashboard");
}

export async function undoCheckIn(input: CheckInInput) {
  const session = await requireSession();
  const parsed = checkInSchema.parse(input);

  const [deleted] = await db
    .delete(habitLogs)
    .where(
      and(
        eq(habitLogs.habitId, parsed.habitId),
        eq(habitLogs.userId, session.user.id),
        eq(habitLogs.date, parsed.date)
      )
    )
    .returning({ id: habitLogs.id });

  if (deleted) {
    await reverseExp(session.user.id, "habit", deleted.id);
  } else {
    // Nothing to reverse, but HP still depends on habit completion — resync
    // so the derived cache stays correct.
    await syncProgress(session.user.id);
  }

  revalidatePath("/habits");
  revalidatePath("/dashboard");
}

export async function archiveHabit(habitId: string) {
  const session = await requireSession();
  await db
    .update(habits)
    .set({ archived: true })
    .where(and(eq(habits.id, habitId), eq(habits.userId, session.user.id)));

  revalidatePath("/habits");
}
