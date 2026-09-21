import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { applySecurityHeaders } from "@/lib/security-headers";
import { clientKey, rateLimit } from "@/lib/rate-limit";

const PUBLIC_EXACT = new Set([
  "/",
  "/pricing",
  "/creations",
  "/sign-in",
  "/sign-up",
  "/payment/success",
  "/payment/cancelled",
  "/payment/failed",
  "/privacy",
  "/cookies",
  "/terms",
  "/refund",
  "/forbidden",
]);

const PUBLIC_PREFIXES = [
  "/sign-in/",
  "/sign-up/",
  "/creations/",
  "/api/webhooks/moneyfusion",
  "/api/payments/webhook",
  "/api/payments/verify/",
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
    "/api/",
  ].some((prefix) => pathname === prefix.replace(/\/$/, "") || pathname.startsWith(prefix));
}

function withSecurity(response: NextResponse, req: NextRequest) {
  applySecurityHeaders(response.headers);
  if (process.env.NODE_ENV === "production") {
    const proto = req.headers.get("x-forwarded-proto");
    const host = req.headers.get("host") ?? "";
    const local = host.startsWith("localhost") || host.startsWith("127.");
    if (proto === "http" && !local) {
      const httpsUrl = req.nextUrl.clone();
      httpsUrl.protocol = "https:";
      return NextResponse.redirect(httpsUrl, 308);
    }
  }
  return response;
}

function applySensitiveRateLimit(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const rules: Array<{ match: (path: string) => boolean; limit: number; windowMs: number; name: string }> = [
    { match: (path) => path === "/api/generate", limit: 8, windowMs: 60_000, name: "generate" },
    { match: (path) => path.startsWith("/api/payments/verify/"), limit: 20, windowMs: 60_000, name: "pay-verify" },
    { match: (path) => path.startsWith("/api/admin/export"), limit: 8, windowMs: 60_000, name: "admin-export" },
    { match: (path) => path.startsWith("/api/admin/"), limit: 40, windowMs: 60_000, name: "admin" },
    { match: (path) => path.includes("webhook"), limit: 80, windowMs: 60_000, name: "webhook" },
    { match: (path) => path === "/api/me/bootstrap", limit: 20, windowMs: 60_000, name: "bootstrap" },
    { match: (path) => path === "/api/me/brand-kit", limit: 20, windowMs: 60_000, name: "brand-kit" },
    { match: (path) => path === "/api/mints/balance", limit: 40, windowMs: 60_000, name: "balance" },
  ];
  for (const rule of rules) {
    if (!rule.match(pathname)) continue;
    const result = rateLimit({
      key: clientKey(req, rule.name),
      limit: rule.limit,
      windowMs: rule.windowMs,
    });
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: "RATE_LIMITED" },
        { status: 429, headers: { "Retry-After": String(Math.ceil(result.retryAfterMs / 1000)) } },
      );
    }
  }
  return null;
}

async function protect(req: NextRequest, userId: string | null) {
  const limited = applySensitiveRateLimit(req);
  if (limited) return withSecurity(limited, req);

  const adminRedirect = hideObviousAdmin(req);
  if (adminRedirect) return withSecurity(adminRedirect, req);

  const { pathname } = req.nextUrl;
  if (isPublicPath(pathname) || !isProtectedPath(pathname)) {
    return withSecurity(NextResponse.next(), req);
  }
  if (userId) {
    return withSecurity(NextResponse.next(), req);
  }
  if (isApiPath(pathname)) {
    return withSecurity(
      NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 }),
      req,
    );
  }
  const signIn = new URL("/sign-in", req.url);
  signIn.searchParams.set("redirect_url", `${pathname}${req.nextUrl.search}`);
  return withSecurity(NextResponse.redirect(signIn), req);
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
