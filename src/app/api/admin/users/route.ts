import { NextResponse } from "next/server";
import { z } from "zod";
import { UserStatus } from "@prisma/client";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    await requireAdminUser();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const users = await prisma.user.findMany({
      where: q
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" } },
              { name: { contains: q, mode: "insensitive" } },
              { clerkUserId: { contains: q } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        creditAccount: true,
      },
    });
    return NextResponse.json({
      ok: true,
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        clerkUserId: u.clerkUserId,
        role: u.role,
        status: u.status,
        balance: u.creditAccount?.balance ?? 0,
      })),
    });
  } catch {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }
}

const statusSchema = z.object({
  targetUserId: z.string().min(3),
  status: z.enum(["ACTIVE", "SUSPENDED"]),
  reason: z.string().min(2),
});

export async function POST(request: Request) {
  try {
    const admin = await requireAdminUser();
    const body = statusSchema.parse(await request.json());
    const status = body.status as UserStatus;
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: body.targetUserId },
        data: { status },
      });
      await tx.adminLog.create({
        data: {
          adminUserId: admin.id,
          action: status === "SUSPENDED" ? "USER_SUSPENDED" : "USER_REACTIVATED",
          targetType: "USER",
          targetId: body.targetUserId,
          metadata: { reason: body.reason },
        },
      });
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "UNKNOWN_ERROR" },
      { status: 400 },
    );
  }
}
