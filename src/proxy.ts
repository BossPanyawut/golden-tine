import { NextResponse } from "next/server";
import { auth } from "@/server/auth/config";

// Optimistic-only check: `req.auth` is decoded from the signed JWT cookie,
// no database round-trip. This is a fast pre-filter, NOT the real
// authorization boundary — every Server Action / Route Handler / Server
// Component still calls requireSession() from server/auth/dal.ts.
const publicRoutes = ["/login", "/register"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth?.user?.id;
  const isPublicRoute = publicRoutes.includes(pathname);

  if (!isAuthenticated && !isPublicRoute) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && isPublicRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
