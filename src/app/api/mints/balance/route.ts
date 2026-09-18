import { NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/server/users";
import { prisma } from "@/lib/prisma";
import { safeJsonError } from "@/lib/safe-api";

export async function GET() {
  try {
    const user = await getOrCreateCurrentUser();
    const account = await prisma.creditAccount.findUnique({
      where: { userId: user.id },
    });
    return NextResponse.json({
      ok: true,
      balance: account?.balance ?? 0,
      label: `${account?.balance ?? 0} Mints = ${account?.balance ?? 0} affiches restantes`,
    });
  } catch (error) {
    return safeJsonError(error, 401);
  }
}
