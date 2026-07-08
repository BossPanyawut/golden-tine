import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { syncProgress } from "@/server/services/progress";
import { env } from "@/server/env";

// Daily maintenance job (Vercel Cron → this route). Recomputes each user's
// derived progress cache: HP drains as scheduled routines are missed, so
// without a daily pass a user who simply stops checking in would keep stale
// full HP. Subscription due-soon/overdue flags are computed at read time, so
// nothing to persist for those here.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Vercel Cron authenticates with the CRON_SECRET bearer token. If the
  // secret isn't configured, refuse rather than run unauthenticated.
  if (!env.CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET not set" }, { status: 500 });
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allUsers = await db.select({ id: users.id }).from(users);
  for (const user of allUsers) {
    await syncProgress(user.id);
  }

  return NextResponse.json({ ok: true, processed: allUsers.length });
}
