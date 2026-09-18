import { auth } from "@clerk/nextjs/server";
import { SiteHeader } from "@/components/site-header";
import { prisma } from "@/lib/prisma";

export async function SiteHeaderHost() {
  const session = await auth();
  let mintBalance: number | null = null;
  if (session.userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { clerkUserId: session.userId },
        include: { creditAccount: true },
      });
      mintBalance = user?.creditAccount?.balance ?? null;
    } catch {
      mintBalance = null;
    }
  }
  return <SiteHeader mintBalance={mintBalance} />;
}
