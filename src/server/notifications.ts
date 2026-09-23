import { prisma } from "@/lib/prisma";

export async function notifyUser(input: {
  userId: string;
  type: string;
  title: string;
  body: string;
  href?: string;
  dedupeKey?: string;
}) {
  if (input.dedupeKey) {
    const existing = await prisma.notification.findUnique({
      where: { userId_dedupeKey: { userId: input.userId, dedupeKey: input.dedupeKey } },
    });
    if (existing) return existing;
  }
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href,
      dedupeKey: input.dedupeKey,
    },
  });
}

export async function notifyAdmins(input: {
  type: string;
  title: string;
  body: string;
  href?: string;
  dedupeKey?: string;
}) {
  const admins = await prisma.user.findMany({ where: { role: "ADMIN", status: "ACTIVE" }, select: { id: true } });
  const created = [];
  for (const admin of admins) {
    created.push(
      await notifyUser({
        userId: admin.id,
        type: input.type,
        title: input.title,
        body: input.body,
        href: input.href,
        dedupeKey: input.dedupeKey ? `${input.dedupeKey}:${admin.id}` : undefined,
      }),
    );
  }
  return created;
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const row = await prisma.notification.findFirst({ where: { id: notificationId, userId } });
  if (!row) throw new Error("NOT_FOUND");
  if (row.readAt) return row;
  return prisma.notification.update({ where: { id: row.id }, data: { readAt: new Date() } });
}

export async function listNotifications(userId: string, take = 30) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
  });
}
