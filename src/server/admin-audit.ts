import { prisma } from "@/lib/prisma";

export async function writeAdminLog(input: {
  adminUserId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  return prisma.adminLog.create({
    data: {
      adminUserId: input.adminUserId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      metadata: input.metadata,
    },
  });
}

export async function logAdminSession(adminUserId: string) {
  const last = await prisma.adminLog.findFirst({
    where: { adminUserId, action: "ADMIN_LOGIN" },
    orderBy: { createdAt: "desc" },
  });
  if (last && Date.now() - last.createdAt.getTime() < 30 * 60 * 1000) {
    return last;
  }
  return writeAdminLog({
    adminUserId,
    action: "ADMIN_LOGIN",
    targetType: "SESSION",
    metadata: { result: "ok" },
  });
}
