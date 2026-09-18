import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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

export default clerkMiddleware(
  async (auth, req) => {
    const { pathname } = req.nextUrl;

    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (isPublicPath(pathname)) {
      return NextResponse.next();
    }

    const { userId } = await auth();
    if (userId) {
      return NextResponse.next();
    }

    if (isApiPath(pathname)) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const signIn = new URL("/sign-in", req.url);
    signIn.searchParams.set("redirect_url", `${pathname}${req.nextUrl.search}`);
    return NextResponse.redirect(signIn);
  },
  {
    signInUrl: "/sign-in",
    signUpUrl: "/sign-up",
  },
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
