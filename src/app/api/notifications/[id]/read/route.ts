import { NextResponse } from "next/server";
import { safeJsonError } from "@/lib/safe-api";
import { requireActiveCurrentUser } from "@/server/users";
import { markNotificationRead } from "@/server/notifications";

type Params = Promise<{ id: string }>;

export async function PATCH(_: Request, { params }: { params: Params }) {
  try {
    const user = await requireActiveCurrentUser();
    const { id } = await params;
    const item = await markNotificationRead(user.id, id);
    return NextResponse.json({ ok: true, readAt: item.readAt });
  } catch (error) {
    return safeJsonError(error);
  }
}

export const POST = PATCH;
