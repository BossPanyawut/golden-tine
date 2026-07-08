import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { rewardRedemptions, rewards } from "@/server/db/schema";
import { requireSession } from "@/server/auth/dal";
import { ensureProgress } from "@/server/services/progress";
import { levelFromExp } from "@/server/services/exp-engine";

/**
 * Current gamification state for the signed-in user. Spendable EXP = total
 * earned minus what's already been spent in the reward shop.
 */
export async function getProgress() {
  const session = await requireSession();
  const progress = await ensureProgress(session.user.id);

  const [{ spent }] = await db
    .select({
      spent: sql<number>`coalesce(sum(${rewardRedemptions.cost}), 0)::int`,
    })
    .from(rewardRedemptions)
    .where(eq(rewardRedemptions.userId, session.user.id));

  const level = levelFromExp(progress.totalExp);
  return {
    totalExp: progress.totalExp,
    spendableExp: progress.totalExp - spent,
    level: level.level,
    currentLevelExp: level.currentLevelExp,
    nextLevelExp: level.nextLevelExp,
    currentHp: progress.currentHp,
    maxHp: progress.maxHp,
  };
}

export async function getRewards() {
  const session = await requireSession();
  return db
    .select()
    .from(rewards)
    .where(
      and(eq(rewards.userId, session.user.id), eq(rewards.archived, false))
    )
    .orderBy(desc(rewards.createdAt));
}

export async function getRecentRedemptions(limit = 10) {
  const session = await requireSession();
  return db
    .select({
      id: rewardRedemptions.id,
      cost: rewardRedemptions.cost,
      createdAt: rewardRedemptions.createdAt,
      rewardName: rewards.name,
    })
    .from(rewardRedemptions)
    .innerJoin(rewards, eq(rewards.id, rewardRedemptions.rewardId))
    .where(eq(rewardRedemptions.userId, session.user.id))
    .orderBy(desc(rewardRedemptions.createdAt))
    .limit(limit);
}
