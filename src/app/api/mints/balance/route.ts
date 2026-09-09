import { NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/server/users";
import { prisma } from "@/lib/prisma";

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
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "UNKNOWN_ERROR" },
      { status: 401 },
    );
  }
}
