import { NextResponse } from "next/server";
import { safeJsonError } from "@/lib/safe-api";
import { generationFeedbackSchema } from "@/lib/support-schema";
import { requireActiveCurrentUser } from "@/server/users";
import { saveGenerationFeedback } from "@/server/feedback";

type Params = Promise<{ id: string }>;

export async function POST(request: Request, { params }: { params: Params }) {
  try {
    const user = await requireActiveCurrentUser();
    const { id } = await params;
    const body = generationFeedbackSchema.parse(await request.json());
    const feedback = await saveGenerationFeedback({ userId: user.id, generationId: id, ...body });
    return NextResponse.json({ ok: true, id: feedback.id, dismissed: feedback.dismissed });
  } catch (error) {
    return safeJsonError(error);
  }
}
