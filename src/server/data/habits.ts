import "server-only";
import { and, desc, eq, gte } from "drizzle-orm";
import { format, subDays } from "date-fns";
import { db } from "@/server/db/client";
import { habitLogs, habits } from "@/server/db/schema";
import { requireSession } from "@/server/auth/dal";
import {
  computeStreak,
  isScheduledDay,
  type HabitRecurrence,
} from "@/server/services/streak-engine";

function toRecurrence(habit: typeof habits.$inferSelect): HabitRecurrence {
  if (habit.recurrence === "weekly") {
    return { kind: "weekly", daysOfWeek: habit.daysOfWeek ?? [] };
  }
  if (habit.recurrence === "monthly") {
    return { kind: "monthly", dayOfMonth: habit.dayOfMonth ?? 1 };
  }
  return { kind: "daily" };
}

export async function getHabits() {
  const session = await requireSession();
  const since = format(subDays(new Date(), 730), "yyyy-MM-dd");

  const rows = await db.query.habits.findMany({
    where: and(eq(habits.userId, session.user.id), eq(habits.archived, false)),
    with: {
      logs: { where: gte(habitLogs.date, since) },
    },
    orderBy: [desc(habits.createdAt)],
  });

  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");

  return rows.map((habit) => {
    const recurrence = toRecurrence(habit);
    const completedDates = habit.logs.map((log) => log.date);
    return {
      id: habit.id,
      name: habit.name,
      category: habit.category,
      recurrence,
      streak: computeStreak(recurrence, completedDates, today),
      scheduledToday: isScheduledDay(recurrence, today),
      completedToday: completedDates.includes(todayStr),
    };
  });
}

export async function getDashboardHabitSummary() {
  const habitsList = await getHabits();
  const scheduledToday = habitsList.filter((habit) => habit.scheduledToday);
  const completedToday = scheduledToday.filter((habit) => habit.completedToday);
  return { total: scheduledToday.length, completed: completedToday.length };
}
