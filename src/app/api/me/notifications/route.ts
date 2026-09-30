import { NextResponse } from "next/server";
import { safeJsonError } from "@/lib/safe-api";
import { listNotifications, markNotificationsRead } from "@/server/notifications";
import { getOrCreateCurrentUser } from "@/server/users";

export async function GET() {
  try {
    const user = await getOrCreateCurrentUser();
    const data = await listNotifications(user.id);
    return NextResponse.json({ ok: true, ...data });
  } catch (error) {
    return safeJsonError(error, 401);
  }
}

export async function POST() {
  try {
    const user = await getOrCreateCurrentUser();
    await markNotificationsRead(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return safeJsonError(error, 401);
  }
}
