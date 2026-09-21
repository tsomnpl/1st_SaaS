import { SiteHeader } from "@/components/site-header";
import { prisma } from "@/lib/prisma";
import { currentUserIsAdmin } from "@/lib/auth";
import { auth } from "@clerk/nextjs/server";

export async function SiteHeaderHost() {
  const session = await auth();
  let mintBalance: number | null = null;
  let showAdmin = false;
  if (session.userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { clerkUserId: session.userId },
        include: { creditAccount: true },
      });
      mintBalance = user?.creditAccount?.balance ?? null;
      showAdmin = await currentUserIsAdmin();
    } catch {
      mintBalance = null;
    }
  }
  return (
    <SiteHeader
      mintBalance={mintBalance}
      showAdmin={showAdmin}
      adminHref={showAdmin ? "/admin" : ""}
    />
  );
}
