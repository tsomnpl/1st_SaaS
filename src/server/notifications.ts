import { UserRole } from "@prisma/client";
import { getAdminClerkIds, getConfiguredAdminEmail } from "@/lib/admin";
import { getAdminPrivatePath } from "@/lib/env";
import { prisma } from "@/lib/prisma";

type NoticeInput = {
  userId: string;
  type: string;
  title: string;
  body: string;
  href?: string;
  dedupeKey?: string;
};

const HISTORY_TYPES = new Set(["GENERATION"]);
const ADMIN_TYPES = new Set(["ADMIN", "TICKET_NEW", "TICKET_URGENT", "INCIDENT"]);

export async function notifyUser(input: NoticeInput) {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type.slice(0, 40),
        title: input.title.slice(0, 140),
        body: input.body.slice(0, 500),
        href: input.href?.slice(0, 300),
        dedupeKey: input.dedupeKey?.slice(0, 160),
      },
    });
  } catch (error) {
    console.error("notification", error instanceof Error ? error.message : "failed");
  }
}

export function adminAlertsHref() {
  const key = getAdminPrivatePath();
  return key ? `/c/${key}` : "/dashboard";
}

export async function notifyAdmins(input: Omit<NoticeInput, "userId">) {
  try {
    const ids = new Set<string>();
    const admins = await prisma.user.findMany({
      where: { role: UserRole.ADMIN },
      select: { id: true },
    });
    for (const admin of admins) ids.add(admin.id);

    const clerkIds = [...getAdminClerkIds()];
    if (clerkIds.length > 0) {
      const byClerk = await prisma.user.findMany({
        where: { clerkUserId: { in: clerkIds } },
        select: { id: true },
      });
      for (const row of byClerk) ids.add(row.id);
    }

    const email = getConfiguredAdminEmail();
    if (email) {
      const byEmail = await prisma.user.findMany({
        where: { email: { equals: email, mode: "insensitive" } },
        select: { id: true },
      });
      for (const row of byEmail) ids.add(row.id);
    }

    await Promise.all([...ids].map((userId) => notifyUser({ ...input, userId })));
  } catch (error) {
    console.error("notifyAdmins", error instanceof Error ? error.message : "failed");
  }
}

export async function listNotifications(userId: string) {
  const [items, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.notification.groupBy({
      by: ["type"],
      where: { userId, readAt: null },
      _count: { _all: true },
    }),
  ]);
  const total = unread.reduce((sum, row) => sum + row._count._all, 0);
  const sumTypes = (allowed: Set<string>) =>
    unread.reduce((sum, row) => sum + (allowed.has(row.type) ? row._count._all : 0), 0);
  return {
    items,
    counts: {
      total,
      history: sumTypes(HISTORY_TYPES),
      admin: sumTypes(ADMIN_TYPES),
    },
  };
}

export async function markNotificationsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}
