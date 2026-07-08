import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { format, subDays } from "date-fns";
import { db } from "@/server/db/client";
import {
  expLedger,
  habitLogs,
  habits,
  userProgress,
} from "@/server/db/schema";
import { levelFromExp } from "@/server/services/exp-engine";
import {
  computeHp,
  missedDaysSince,
  MAX_HP,
} from "@/server/services/hp-engine";
import {
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

/**
 * Recompute HP from scratch off the user's habits — counts scheduled days
 * missed since each habit's last completion, over a bounded lookback window.
 * Deterministic; safe to call any time (dashboard load, cron, after a
 * check-in).
 */
export async function recomputeHp(userId: string): Promise<number> {
  const lookbackDays = 30;
  const today = new Date();
  const since = format(subDays(today, lookbackDays), "yyyy-MM-dd");

  const rows = await db.query.habits.findMany({
    where: and(eq(habits.userId, userId), eq(habits.archived, false)),
    with: { logs: { where: sql`${habitLogs.date} >= ${since}` } },
  });

  const inputs = rows.map((habit) => {
    const recurrence = toRecurrence(habit);
    const completedDates = new Set(habit.logs.map((l) => l.date));

    let lastCompleted: Date | null = null;
    let scheduledSinceLast = 0;
    for (let i = 0; i <= lookbackDays; i++) {
      const d = subDays(today, i);
      const dateStr = format(d, "yyyy-MM-dd");
      if (completedDates.has(dateStr)) {
        lastCompleted = d;
        break;
      }
      if (isScheduledDay(recurrence, d) && dateStr !== format(today, "yyyy-MM-dd")) {
        scheduledSinceLast += 1;
      }
    }

    return {
      missedScheduledDays: missedDaysSince(
        lastCompleted,
        today,
        scheduledSinceLast
      ),
    };
  });

  return computeHp(inputs);
}

/** Ensure a user_progress row exists, returning the current state. */
export async function ensureProgress(userId: string) {
  const [existing] = await db
    .select()
    .from(userProgress)
    .where(eq(userProgress.userId, userId))
    .limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(userProgress)
    .values({ userId })
    .onConflictDoNothing()
    .returning();
  if (created) return created;

  const [row] = await db
    .select()
    .from(userProgress)
    .where(eq(userProgress.userId, userId))
    .limit(1);
  return row;
}

/**
 * Sum the EXP ledger, recompute level + HP, and upsert the derived
 * user_progress cache. The ledger is the source of truth; this just keeps the
 * fast-read cache correct.
 */
export async function syncProgress(userId: string) {
  const [{ total }] = await db
    .select({ total: sql<number>`coalesce(sum(${expLedger.amount}), 0)::int` })
    .from(expLedger)
    .where(eq(expLedger.userId, userId));

  const { level } = levelFromExp(total);
  const hp = await recomputeHp(userId);

  await db
    .insert(userProgress)
    .values({
      userId,
      totalExp: total,
      level,
      currentHp: hp,
      maxHp: MAX_HP,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userProgress.userId,
      set: { totalExp: total, level, currentHp: hp, maxHp: MAX_HP, updatedAt: new Date() },
    });

  return { totalExp: total, level, currentHp: hp, maxHp: MAX_HP };
}

/** Record an EXP award (idempotent per source ref) and resync progress. */
export async function awardExp(
  userId: string,
  source: "task" | "habit",
  amount: number,
  sourceRefId: string
) {
  await db
    .insert(expLedger)
    .values({ userId, source, amount, sourceRefId });
  await syncProgress(userId);
}

/** Reverse a prior award (e.g. task un-completed) and resync. */
export async function reverseExp(
  userId: string,
  source: "task" | "habit",
  sourceRefId: string
) {
  await db
    .delete(expLedger)
    .where(
      and(
        eq(expLedger.userId, userId),
        eq(expLedger.source, source),
        eq(expLedger.sourceRefId, sourceRefId)
      )
    );
  await syncProgress(userId);
}
