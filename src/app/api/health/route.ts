import { NextResponse } from "next/server";
import { getAdminPrivatePath } from "@/lib/env";

export async function GET() {
  const publishable = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ?? "";
  return NextResponse.json({
    ok: true,
    service: "flyermint",
    adminPathConfigured: Boolean(getAdminPrivatePath()),
    clerkLive: publishable.startsWith("pk_live_"),
  });
}
