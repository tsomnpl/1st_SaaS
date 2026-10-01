import { SiteHeader } from "@/components/site-header";
import { prisma } from "@/lib/prisma";
import { isConfiguredAdmin } from "@/lib/admin";
import { currentUserIsAdmin } from "@/lib/auth";
import { getAdminPrivatePath } from "@/lib/env";
import { auth } from "@clerk/nextjs/server";
import { ensureAccountColumns } from "@/server/schema-heal";

export async function SiteHeaderHost() {
  const session = await auth();
  let mintBalance: number | null = null;
  let showAdmin = false;
  if (session.userId) {
    try {
      showAdmin = await currentUserIsAdmin();
    } catch {
      showAdmin = false;
    }
    try {
      await ensureAccountColumns();
    } catch {
      // A failed repair must not hide a balance the database can already return.
    }
    try {
      const user = await prisma.user.findUnique({
        where: { clerkUserId: session.userId },
        include: { creditAccount: true },
      });
      mintBalance = user?.creditAccount?.balance ?? null;
      if (!showAdmin && user?.email) {
        showAdmin = isConfiguredAdmin({ clerkUserId: session.userId, email: user.email });
      }
    } catch {
      mintBalance = null;
    }
  }
  return (
    <SiteHeader
      signedIn={Boolean(session.userId)}
      mintBalance={mintBalance}
      showAdmin={showAdmin}
      adminHref={showAdmin && getAdminPrivatePath() ? `/c/${getAdminPrivatePath()}` : ""}
    />
  );
}
