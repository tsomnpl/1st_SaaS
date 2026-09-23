import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminUser } from "@/lib/auth";
import { safeJsonError } from "@/lib/safe-api";
import { updateIncident } from "@/server/incidents";

const schema = z.object({
  status: z.enum(["OPEN", "INVESTIGATING", "MITIGATED", "RESOLVED", "CLOSED"]),
});

type Params = Promise<{ id: string }>;

export async function POST(request: Request, { params }: { params: Params }) {
  try {
    const admin = await requireAdminUser();
    const { id } = await params;
    const body = schema.parse(await request.json());
    const incident = await updateIncident({ incidentId: id, adminUserId: admin.id, status: body.status });
    return NextResponse.json({ ok: true, publicId: incident.publicId, status: incident.status });
  } catch (error) {
    return safeJsonError(error);
  }
}
