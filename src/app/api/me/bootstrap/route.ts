import { NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/server/users";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const user = await getOrCreateCurrentUser();
    const account = await prisma.creditAccount.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        role: user.role,
        status: user.status,
      },
      balance: account?.balance ?? 0,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: getErrorMessage(error) },
      { status: 401 },
    );
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "UNKNOWN_ERROR";
}
