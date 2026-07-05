import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireSession } from "@/server/auth/dal";
import { getDashboardTaskSummary } from "@/server/data/tasks";
import { getDashboardHabitSummary } from "@/server/data/habits";

export default async function DashboardPage() {
  const session = await requireSession();
  const firstName = session.user.name?.split(" ")[0] || "there";

  const [taskSummary, habitSummary] = await Promise.all([
    getDashboardTaskSummary(),
    getDashboardHabitSummary(),
  ]);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle>Welcome back, {firstName}</CardTitle>
          <CardDescription>
            This is your Today dashboard — habit progress, today&apos;s
            tasks, and money/mood summaries will land here as each module
            ships.
          </CardDescription>
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
        </Card>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Money & Mood</CardTitle>
          <CardDescription>
            Finance, mood, CRM reminders — Phase 2 / 3
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
