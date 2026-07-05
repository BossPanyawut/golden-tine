import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireSession } from "@/server/auth/dal";

export default async function SettingsPage() {
  const session = await requireSession();

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>Your Golden Tine account details.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Name</span>
          <span>{session.user.name || "—"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Email</span>
          <span>{session.user.email}</span>
        </div>
      </CardContent>
    </Card>
  );
}
