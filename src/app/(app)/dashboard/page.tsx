import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireSession } from "@/server/auth/dal";

export default async function DashboardPage() {
  const session = await requireSession();
  const firstName = session.user.name?.split(" ")[0] || "there";

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
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Habits & Routines</CardTitle>
          <CardDescription>Streaks, HP — Phase 1 / 2</CardDescription>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Today&apos;s Tasks</CardTitle>
          <CardDescription>Work & personal projects — Phase 1</CardDescription>
        </CardHeader>
      </Card>
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
