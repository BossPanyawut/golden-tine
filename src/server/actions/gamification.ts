"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { requireSession } from "@/server/auth/dal";
import { db } from "@/server/db/client";
import {
  rewardRedemptions,
  rewards,
  expLedger,
} from "@/server/db/schema";
import { createRewardSchema, type CreateRewardInput } from "@/lib/validation/rewards";

export async function createReward(input: CreateRewardInput) {
  const session = await requireSession();
  const parsed = createRewardSchema.parse(input);

  await db.insert(rewards).values({
    userId: session.user.id,
    name: parsed.name,
    cost: parsed.cost,
  });

  revalidatePath("/gamification");
}

export async function archiveReward(rewardId: string) {
  const session = await requireSession();
  await db
    .update(rewards)
    .set({ archived: true })
    .where(and(eq(rewards.id, rewardId), eq(rewards.userId, session.user.id)));

  revalidatePath("/gamification");
}

export type RedeemResult = { error: string } | { ok: true };

export async function redeemReward(rewardId: string): Promise<RedeemResult> {
  const session = await requireSession();
  const userId = session.user.id;

  const [reward] = await db
    .select({ id: rewards.id, cost: rewards.cost, archived: rewards.archived })
    .from(rewards)
    .where(and(eq(rewards.id, rewardId), eq(rewards.userId, userId)))
    .limit(1);
  if (!reward || reward.archived) {
    return { error: "Reward not found." };
  }

  // Spendable EXP = total earned − already spent. Recompute at redeem time so
  // two quick redemptions can't both pass a stale balance check.
  const [{ earned }] = await db
    .select({ earned: sql<number>`coalesce(sum(${expLedger.amount}), 0)::int` })
    .from(expLedger)
    .where(eq(expLedger.userId, userId));
  const [{ spent }] = await db
    .select({
      spent: sql<number>`coalesce(sum(${rewardRedemptions.cost}), 0)::int`,
    })
    .from(rewardRedemptions)
    .where(eq(rewardRedemptions.userId, userId));

  const spendable = earned - spent;
  if (spendable < reward.cost) {
    return { error: `Not enough EXP — need ${reward.cost}, have ${spendable}.` };
  }

  await db.insert(rewardRedemptions).values({
    userId,
    rewardId: reward.id,
    cost: reward.cost,
  });

  revalidatePath("/gamification");
  return { ok: true };
}
