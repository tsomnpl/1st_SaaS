import { NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/server/users";
import { prisma } from "@/lib/prisma";
import { safeJsonError } from "@/lib/safe-api";

export async function POST() {
  try {
    const user = await getOrCreateCurrentUser();
    const account = await prisma.creditAccount.findUnique({
      where: { userId: user.id },
    });
    const kit = await prisma.brandKit.findUnique({ where: { userId: user.id } });

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        role: user.role,
        status: user.status,
      },
      balance: account?.balance ?? 0,
      brandKit: kit
        ? { colors: kit.colors, hasLogo: Boolean(kit.logoUrl) }
        : { colors: [], hasLogo: false },
    });
  } catch (error) {
    return safeJsonError(error, 401);
  }
}
