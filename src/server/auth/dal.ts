import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth/config";

// Centralizes the "real" (secure) auth check. Server Components, Server
// Actions, and Route Handlers should call this rather than reading the
// session directly — proxy.ts only does an optimistic cookie-based redirect
// and must not be relied on as the sole line of defense.
export const requireSession = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session;
});

export const getSession = cache(async () => auth());
