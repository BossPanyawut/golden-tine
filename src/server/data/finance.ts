import "server-only";
import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { addDays, format } from "date-fns";
import { db } from "@/server/db/client";
import {
  goalFundings,
  subscriptions,
  transactions,
} from "@/server/db/schema";
import { requireSession } from "@/server/auth/dal";

export async function getTransactions(limit = 100) {
  const session = await requireSession();
  return db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, session.user.id))
    .orderBy(desc(transactions.date), desc(transactions.createdAt))
    .limit(limit);
}

export async function getBalance() {
  const session = await requireSession();
  const [row] = await db
    .select({
      income: sql<string>`coalesce(sum(case when ${transactions.type} = 'income' then ${transactions.amount} else 0 end), 0)`,
      expense: sql<string>`coalesce(sum(case when ${transactions.type} = 'expense' then ${transactions.amount} else 0 end), 0)`,
    })
    .from(transactions)
    .where(eq(transactions.userId, session.user.id));

  const income = Number(row?.income ?? 0);
  const expense = Number(row?.expense ?? 0);
  return { income, expense, balance: income - expense };
}

export async function getGoalFundings() {
  const session = await requireSession();
  return db
    .select()
    .from(goalFundings)
    .where(eq(goalFundings.userId, session.user.id))
    .orderBy(asc(goalFundings.createdAt));
}

export async function getSubscriptions() {
  const session = await requireSession();
  const rows = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, session.user.id),
        eq(subscriptions.active, true)
      )
    )
    .orderBy(asc(subscriptions.nextBillingDate));

  const today = format(new Date(), "yyyy-MM-dd");
  return rows.map((sub) => {
    const dueSoonThreshold = format(
      addDays(new Date(), sub.reminderDaysBefore),
      "yyyy-MM-dd"
    );
    return {
      ...sub,
      dueSoon: sub.nextBillingDate <= dueSoonThreshold,
      overdue: sub.nextBillingDate < today,
    };
  });
}

export async function getUpcomingSubscriptionCount() {
  const session = await requireSession();
  const rows = await db
    .select({
      nextBillingDate: subscriptions.nextBillingDate,
      reminderDaysBefore: subscriptions.reminderDaysBefore,
    })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, session.user.id),
        eq(subscriptions.active, true)
      )
    );

  const today = new Date();
  return rows.filter(
    (sub) =>
      sub.nextBillingDate <=
      format(addDays(today, sub.reminderDaysBefore), "yyyy-MM-dd")
  ).length;
}

// Reused by the cron route to find subscriptions billing within N days.
export async function getSubscriptionsDueWithin(userId: string, days: number) {
  const cutoff = format(addDays(new Date(), days), "yyyy-MM-dd");
  const today = format(new Date(), "yyyy-MM-dd");
  return db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.active, true),
        gte(subscriptions.nextBillingDate, today),
        lte(subscriptions.nextBillingDate, cutoff)
      )
    );
}
