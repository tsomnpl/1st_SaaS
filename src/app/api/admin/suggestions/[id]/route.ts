import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminUser } from "@/lib/auth";
import { safeJsonError } from "@/lib/safe-api";
import { updateSuggestionStatus } from "@/server/feedback";

const schema = z.object({
  status: z.enum(["NEW", "REVIEWING", "PLANNED", "IN_PROGRESS", "RELEASED", "DECLINED"]),
});

type Params = Promise<{ id: string }>;

export async function POST(request: Request, { params }: { params: Params }) {
  try {
    const admin = await requireAdminUser();
    const { id } = await params;
    const body = schema.parse(await request.json());
    const row = await updateSuggestionStatus({ suggestionId: id, status: body.status, adminUserId: admin.id });
    return NextResponse.json({ ok: true, status: row.status });
  } catch (error) {
    return safeJsonError(error);
  }
}
