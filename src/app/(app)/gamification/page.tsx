import { formatDistanceToNow } from "date-fns";
import { getProgress, getRewards, getRecentRedemptions } from "@/server/data/gamification";
import { StatsBars } from "./_components/stats-bars";
import { RewardShop } from "./_components/reward-shop";

export default async function GamificationPage() {
  const [progress, rewards, redemptions] = await Promise.all([
    getProgress(),
    getRewards(),
    getRecentRedemptions(),
  ]);

  return (
    <div className="space-y-6">
      <StatsBars progress={progress} />
      <RewardShop rewards={rewards} spendableExp={progress.spendableExp} />

      {redemptions.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">Recent redemptions</h2>
          <div className="divide-y rounded-lg border px-3">
            {redemptions.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between py-2 text-sm"
              >
                <span>{r.rewardName}</span>
                <span className="text-xs text-muted-foreground">
                  −{r.cost} EXP ·{" "}
                  {formatDistanceToNow(r.createdAt, { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
