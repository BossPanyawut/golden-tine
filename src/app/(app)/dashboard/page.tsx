import Link from "next/link";
import { Heart, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireSession } from "@/server/auth/dal";
import { getDashboardTaskSummary } from "@/server/data/tasks";
import { getDashboardHabitSummary } from "@/server/data/habits";
import {
  getBalance,
  getUpcomingSubscriptionCount,
} from "@/server/data/finance";
import { getProgress } from "@/server/data/gamification";
import { formatMoney } from "@/lib/format";

export default async function DashboardPage() {
  const session = await requireSession();
  const firstName = session.user.name?.split(" ")[0] || "there";

  const [taskSummary, habitSummary, balance, progress, dueSubs] =
    await Promise.all([
      getDashboardTaskSummary(),
      getDashboardHabitSummary(),
      getBalance(),
      getProgress(),
      getUpcomingSubscriptionCount(),
    ]);

  const hpPct = Math.round((progress.currentHp / progress.maxHp) * 100);
  const hpColor =
    hpPct > 50 ? "bg-emerald-500" : hpPct > 20 ? "bg-amber-500" : "bg-destructive";
  const expPct =
    progress.nextLevelExp > 0
      ? Math.round((progress.currentLevelExp / progress.nextLevelExp) * 100)
      : 0;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="md:col-span-3">
        <CardHeader className="flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Welcome back, {firstName}</CardTitle>
            <CardDescription>Here&apos;s your day at a glance.</CardDescription>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="size-4 text-primary" />
              Lv {progress.level}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Heart className="size-4 text-destructive" />
              {progress.currentHp}/{progress.maxHp}
            </span>
          </div>
        </CardHeader>
      </Card>

      <Link href="/habits">
        <Card className="h-full transition-colors hover:bg-muted/40">
          <CardHeader>
            <CardTitle className="text-base">Habits & Routines</CardTitle>
            <CardDescription>
              {habitSummary.total === 0
                ? "No habits scheduled today"
                : `${habitSummary.completed} / ${habitSummary.total} done today`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${hpColor}`}
                style={{ width: `${hpPct}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">HP {hpPct}%</p>
          </CardContent>
        </Card>
      </Link>

      <Link href="/tasks?view=today">
        <Card className="h-full transition-colors hover:bg-muted/40">
          <CardHeader>
            <CardTitle className="text-base">Today&apos;s Tasks</CardTitle>
            <CardDescription>
              {taskSummary.dueToday} due today
              {taskSummary.overdue > 0 && ` · ${taskSummary.overdue} overdue`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${expPct}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Level {progress.level} · {progress.currentLevelExp}/
              {progress.nextLevelExp} EXP
            </p>
          </CardContent>
        </Card>
      </Link>

      <Link href="/finance">
        <Card className="h-full transition-colors hover:bg-muted/40">
          <CardHeader>
            <CardTitle className="text-base">Money</CardTitle>
            <CardDescription>Current balance</CardDescription>
          </CardHeader>
          <CardContent>
            <p
              className={
                balance.balance >= 0
                  ? "text-xl font-semibold"
                  : "text-xl font-semibold text-destructive"
              }
            >
              {formatMoney(balance.balance)}
            </p>
            {dueSubs > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                {dueSubs} subscription{dueSubs > 1 ? "s" : ""} due soon
              </p>
            )}
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
