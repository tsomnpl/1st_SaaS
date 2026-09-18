import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_EXACT = new Set([
  "/",
  "/pricing",
  "/creations",
  "/sign-in",
  "/sign-up",
  "/payment/success",
]);

const PUBLIC_PREFIXES = [
  "/sign-in/",
  "/sign-up/",
  "/creations/",
  "/api/webhooks/moneyfusion",
  "/api/payments/webhook",
  "/api/health",
];

function isPublicPath(pathname: string) {
  if (PUBLIC_EXACT.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isApiPath(pathname: string) {
  return pathname.startsWith("/api/");
}

function hideObviousAdmin(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return null;
}

function isProtectedPath(pathname: string) {
  return [
    "/dashboard",
    "/create",
    "/history",
    "/profile",
    "/checkout",
    "/c/",
    "/api/",
  ].some((prefix) => pathname === prefix.replace(/\/$/, "") || pathname.startsWith(prefix));
}

async function protect(req: NextRequest, userId: string | null) {
  const adminRedirect = hideObviousAdmin(req);
  if (adminRedirect) return adminRedirect;

  const { pathname } = req.nextUrl;
  if (isPublicPath(pathname) || !isProtectedPath(pathname)) {
    return NextResponse.next();
  }
  if (userId) {
    return NextResponse.next();
  }
  if (isApiPath(pathname)) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  const signIn = new URL("/sign-in", req.url);
  signIn.searchParams.set("redirect_url", `${pathname}${req.nextUrl.search}`);
  return NextResponse.redirect(signIn);
}

const clerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

export default clerkConfigured
  ? clerkMiddleware(
      async (auth, req) => {
        const { userId } = await auth();
        return protect(req, userId);
      },
      {
        signInUrl: "/sign-in",
        signUpUrl: "/sign-up",
      },
    )
  : function proxy(req: NextRequest) {
      return protect(req, null);
    };

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
