import { NextResponse } from "next/server";
import { safeJsonError } from "@/lib/safe-api";
import { requireActiveCurrentUser } from "@/server/users";
import { listNotifications } from "@/server/notifications";

export async function GET() {
  try {
    const user = await requireActiveCurrentUser();
    const items = await listNotifications(user.id);
    return NextResponse.json({
      ok: true,
      unread: items.filter((item) => !item.readAt).length,
      items,
    });
  } catch (error) {
    return safeJsonError(error);
  }
}
