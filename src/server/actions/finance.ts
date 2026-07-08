"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { addMonths, addYears, format } from "date-fns";
import { requireSession } from "@/server/auth/dal";
import { db } from "@/server/db/client";
import { goalFundings, subscriptions, transactions } from "@/server/db/schema";
import {
  contributeGoalSchema,
  createGoalFundingSchema,
  createSubscriptionSchema,
  createTransactionSchema,
  type ContributeGoalInput,
  type CreateGoalFundingInput,
  type CreateSubscriptionInput,
  type CreateTransactionInput,
} from "@/lib/validation/finance";

export async function createTransaction(input: CreateTransactionInput) {
  const session = await requireSession();
  const parsed = createTransactionSchema.parse(input);

  await db.insert(transactions).values({
    userId: session.user.id,
    type: parsed.type,
    amount: parsed.amount,
    category: parsed.category,
    note: parsed.note,
    date: parsed.date,
  });

  revalidatePath("/finance");
  revalidatePath("/dashboard");
}

export async function deleteTransaction(transactionId: string) {
  const session = await requireSession();
  await db
    .delete(transactions)
    .where(
      and(
        eq(transactions.id, transactionId),
        eq(transactions.userId, session.user.id)
      )
    );

  revalidatePath("/finance");
  revalidatePath("/dashboard");
}

export async function createGoalFunding(input: CreateGoalFundingInput) {
  const session = await requireSession();
  const parsed = createGoalFundingSchema.parse(input);

  await db.insert(goalFundings).values({
    userId: session.user.id,
    name: parsed.name,
    projectId: parsed.projectId,
    targetAmount: parsed.targetAmount,
  });

  revalidatePath("/finance");
}

export async function contributeToGoal(input: ContributeGoalInput) {
  const session = await requireSession();
  const parsed = contributeGoalSchema.parse(input);

  await db
    .update(goalFundings)
    .set({
      savedAmount: sql`${goalFundings.savedAmount} + ${parsed.amount}`,
    })
    .where(
      and(
        eq(goalFundings.id, parsed.goalId),
        eq(goalFundings.userId, session.user.id)
      )
    );

  revalidatePath("/finance");
}

export async function deleteGoalFunding(goalId: string) {
  const session = await requireSession();
  await db
    .delete(goalFundings)
    .where(
      and(eq(goalFundings.id, goalId), eq(goalFundings.userId, session.user.id))
    );

  revalidatePath("/finance");
}

export async function createSubscription(input: CreateSubscriptionInput) {
  const session = await requireSession();
  const parsed = createSubscriptionSchema.parse(input);

  await db.insert(subscriptions).values({
    userId: session.user.id,
    name: parsed.name,
    amount: parsed.amount,
    cycle: parsed.cycle,
    nextBillingDate: parsed.nextBillingDate,
    reminderDaysBefore: parsed.reminderDaysBefore,
  });

  revalidatePath("/finance");
  revalidatePath("/dashboard");
}

// Roll the next billing date forward by one cycle (used when a charge has
// gone through) and keep the subscription active.
export async function advanceSubscription(subscriptionId: string) {
  const session = await requireSession();
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.id, subscriptionId),
        eq(subscriptions.userId, session.user.id)
      )
    )
    .limit(1);
  if (!sub) return;

  const current = new Date(`${sub.nextBillingDate}T00:00:00`);
  const next =
    sub.cycle === "yearly" ? addYears(current, 1) : addMonths(current, 1);

  await db
    .update(subscriptions)
    .set({ nextBillingDate: format(next, "yyyy-MM-dd") })
    .where(eq(subscriptions.id, subscriptionId));

  revalidatePath("/finance");
  revalidatePath("/dashboard");
}

export async function cancelSubscription(subscriptionId: string) {
  const session = await requireSession();
  await db
    .update(subscriptions)
    .set({ active: false })
    .where(
      and(
        eq(subscriptions.id, subscriptionId),
        eq(subscriptions.userId, session.user.id)
      )
    );

  revalidatePath("/finance");
  revalidatePath("/dashboard");
}
