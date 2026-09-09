import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdminUser();
    const users = await prisma.user.findMany({
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
        clerkUserId: u.clerkUserId,
        role: u.role,
        status: u.status,
        balance: u.creditAccount?.balance ?? 0,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "UNKNOWN_ERROR" },
      { status: 403 },
    );
  }
}
