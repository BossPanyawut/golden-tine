import { format, getDate, getDay, subDays } from "date-fns";

export type HabitRecurrence =
  | { kind: "daily" }
  | { kind: "weekly"; daysOfWeek: number[] } // 0=Sun..6=Sat
  | { kind: "monthly"; dayOfMonth: number }; // 1-31

export interface StreakResult {
  current: number;
  longest: number;
}

export function isScheduledDay(recurrence: HabitRecurrence, date: Date): boolean {
  switch (recurrence.kind) {
    case "daily":
      return true;
    case "weekly":
      return recurrence.daysOfWeek.includes(getDay(date));
    case "monthly":
      return getDate(date) === recurrence.dayOfMonth;
  }
}

/**
 * Current streak allows today to still be incomplete without breaking it —
 * the day isn't over yet. Any other missed scheduled day breaks the streak.
 */
export function computeStreak(
  recurrence: HabitRecurrence,
  completedDates: readonly string[],
  today: Date = new Date(),
  lookbackDays = 730
): StreakResult {
  const completed = new Set(completedDates);
  const todayStr = format(today, "yyyy-MM-dd");

  const scheduled: { dateStr: string; done: boolean }[] = [];
  for (let i = lookbackDays; i >= 0; i--) {
    const day = subDays(today, i);
    if (!isScheduledDay(recurrence, day)) continue;
    const dateStr = format(day, "yyyy-MM-dd");
    scheduled.push({ dateStr, done: completed.has(dateStr) });
  }

  let longest = 0;
  let run = 0;
  for (const day of scheduled) {
    if (day.done) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 0;
    }
  }

  let current = 0;
  for (let i = scheduled.length - 1; i >= 0; i--) {
    const day = scheduled[i];
    if (day.dateStr === todayStr && !day.done) continue;
    if (day.done) {
      current += 1;
    } else {
      break;
    }
  }

  return { current, longest };
}
