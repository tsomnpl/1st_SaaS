import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getAdminPrivatePath } from "@/lib/env";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/create(.*)",
  "/history(.*)",
  "/api/(.*)",
]);

const isPublicApiRoute = createRouteMatcher([
  "/api/webhooks/moneyfusion(.*)",
  "/api/payments/webhook(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;
  const adminPrivatePath = `/${getAdminPrivatePath()}`;

  // Hide obvious admin route and force use of private path.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (
    pathname === adminPrivatePath ||
    pathname.startsWith(`${adminPrivatePath}/`)
  ) {
    await auth.protect();
    return NextResponse.next();
  }

  if (isProtectedRoute(req)) {
    if (isPublicApiRoute(req)) {
      return NextResponse.next();
    }
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/"],
};
