import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { safeJsonError } from "@/lib/safe-api";
import { discardUncreditedPayments } from "@/server/payment-discard";

export async function POST() {
  try {
    const admin = await requireAdminUser();
    const result = await discardUncreditedPayments(admin.id);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return safeJsonError(error);
  }
}
