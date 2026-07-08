import { differenceInCalendarDays } from "date-fns";

export const MAX_HP = 100;
// HP lost per missed scheduled habit-day, once the grace period passes.
const HP_PER_MISSED_DAY = 10;
// Days you can miss before HP starts draining (soft punishment, not instant).
const GRACE_DAYS = 1;

export interface HpInput {
  // For each active habit: the last date (yyyy-mm-dd) it was completed, or
  // null if never; and how many scheduled days it has been missed since.
  missedScheduledDays: number;
}

/**
 * Soft-penalty HP: neglecting routines for several days drains the bar as a
 * nudge. Computed from missed scheduled habit-days across all habits, clamped
 * to [0, MAX_HP]. Pure function so it's trivially testable and deterministic.
 */
export function computeHp(habits: readonly HpInput[]): number {
  const totalPenalty = habits.reduce((sum, h) => {
    const overGrace = Math.max(0, h.missedScheduledDays - GRACE_DAYS);
    return sum + overGrace * HP_PER_MISSED_DAY;
  }, 0);
  return Math.max(0, Math.min(MAX_HP, MAX_HP - totalPenalty));
}

/**
 * Missed scheduled days for one habit since its last completion — capped so a
 * single long-neglected habit can't dominate. `scheduledDatesSince` is how
 * many scheduled occurrences fell between last completion and today.
 */
export function missedDaysSince(
  lastCompleted: Date | null,
  today: Date,
  scheduledOccurrences: number,
  cap = 5
): number {
  if (lastCompleted === null) {
    return Math.min(scheduledOccurrences, cap);
  }
  if (differenceInCalendarDays(today, lastCompleted) <= 0) return 0;
  return Math.min(scheduledOccurrences, cap);
}
