import { Heart, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { getProgress } from "@/server/data/gamification";

type Progress = Awaited<ReturnType<typeof getProgress>>;

export function StatsBars({ progress }: { progress: Progress }) {
  const expPct =
    progress.nextLevelExp > 0
      ? Math.round((progress.currentLevelExp / progress.nextLevelExp) * 100)
      : 0;
  const hpPct = Math.round((progress.currentHp / progress.maxHp) * 100);
  const hpColor =
    hpPct > 50
      ? "bg-emerald-500"
      : hpPct > 20
        ? "bg-amber-500"
        : "bg-destructive";

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-primary" />
            Level {progress.level}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${expPct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {progress.currentLevelExp} / {progress.nextLevelExp} EXP
            </span>
            <span>{progress.spendableExp} spendable</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Heart className="size-4 text-destructive" />
            HP
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${hpColor}`}
              style={{ width: `${hpPct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {progress.currentHp} / {progress.maxHp}
            </span>
            <span>
              {hpPct <= 20
                ? "Routines slipping — check in!"
                : hpPct < 100
                  ? "Keep your routines up"
                  : "Full health"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
