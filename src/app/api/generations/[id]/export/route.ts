import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveCurrentUser } from "@/server/users";
import { userHasEditableExport } from "@/server/generation";

type Params = Promise<{ id: string }>;

export async function GET(_: Request, { params }: { params: Params }) {
  try {
    const user = await requireActiveCurrentUser();
    const { id } = await params;
    const allowed = await userHasEditableExport(user.id);
    if (!allowed) {
      return NextResponse.json({ ok: false, error: "EXPORT_LOCKED" }, { status: 403 });
    }

    const generation = await prisma.generation.findFirst({
      where: { id, userId: user.id, status: "COMPLETED" },
    });
    if (!generation?.outputUrl) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    const brief = generation.brief as Record<string, string>;
    const html = `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><title>${escapeHtml(brief.title ?? "Affiche FlyerMint")}</title></head>
<body style="font-family:sans-serif;max-width:720px;margin:40px auto">
  <h1>${escapeHtml(brief.title ?? "Affiche")}</h1>
  <p>${escapeHtml(brief.subtitle ?? "")}</p>
  <p>${escapeHtml(brief.description ?? "")}</p>
  <p>Prix : ${escapeHtml(brief.price ?? "")}</p>
  <p>Date : ${escapeHtml(brief.date ?? "")} ${escapeHtml(brief.time ?? "")}</p>
  <p>Lieu : ${escapeHtml(brief.location ?? "")}</p>
  <p>Téléphone : ${escapeHtml(brief.contactPhone ?? "")}</p>
  <p>WhatsApp : ${escapeHtml(brief.whatsapp ?? "")}</p>
  <p>CTA : ${escapeHtml(brief.cta ?? "")}</p>
  <p><img src="${escapeHtml(generation.outputUrl)}" alt="Affiche" style="max-width:100%"/></p>
  <p>Pack éditable FlyerMint — image + textes. Ouvert par Word ou un navigateur. Pas d’intégration Figma/Canva.</p>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="flyermint-${generation.id}.html"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "UNKNOWN_ERROR" },
      { status: 400 },
    );
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
