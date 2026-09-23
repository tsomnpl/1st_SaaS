import { NextResponse } from "next/server";
import { safeJsonError } from "@/lib/safe-api";
import { feedbackSchema } from "@/lib/support-schema";
import { requireActiveCurrentUser } from "@/server/users";
import { saveGenerationFeedback } from "@/server/feedback";

export async function POST(request: Request) {
  try {
    const user = await requireActiveCurrentUser();
    const body = feedbackSchema.parse(await request.json());
    const feedback = await saveGenerationFeedback({ userId: user.id, ...body });
    return NextResponse.json({ ok: true, id: feedback.id, dismissed: feedback.dismissed });
  } catch (error) {
    return safeJsonError(error);
  }
}
