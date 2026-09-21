import type { Metadata } from "next";
import Link from "next/link";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Historique"),
  robots: { index: false, follow: false },
};
import { prisma } from "@/lib/prisma";
import { requireActiveCurrentUser } from "@/server/users";
import { userHasEditableExport } from "@/server/generation";

export default async function HistoryPage() {
  const user = await requireActiveCurrentUser();
  const canExport = await userHasEditableExport(user.id);
  const generations = await prisma.generation.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Historique</h1>
          <p className="mt-1 text-slate-600">Tes affiches, prêtes à télécharger.</p>
        </div>
        <Link href="/create" className="btn-primary">
          Créer une affiche
        </Link>
      </div>

      {generations.length === 0 ? (
        <div className="card p-8 text-center text-slate-500">Aucune création pour l’instant.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {generations.map((generation) => {
            const brief = generation.brief as { title?: string; domain?: string };
            return (
              <article key={generation.id} className="card overflow-hidden">
                {generation.outputUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={generation.outputUrl}
                    alt={`Affiche « ${brief.title ?? "sans titre"} »${brief.domain ? ` — ${brief.domain}` : ""}`}
                    className="aspect-[3/4] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[3/4] items-center justify-center bg-slate-50 text-sm text-slate-400">
                    {generation.status === "FAILED" ? "Génération échouée" : "En cours"}
                  </div>
                )}
                <div className="space-y-2 p-4">
                  <p className="font-semibold">{brief.title ?? "Sans titre"}</p>
                  <p className="text-xs text-slate-500">
                    {brief.domain ?? "—"} · {new Date(generation.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {generation.outputUrl ? (
                      <a href={generation.outputUrl} download className="text-sm font-semibold text-[#20C997]">
                        Télécharger
                      </a>
                    ) : null}
                    {canExport && generation.outputUrl ? (
                      <a
                        href={`/api/generations/${generation.id}/export`}
                        className="text-sm font-semibold text-slate-600"
                      >
                        Pack éditable
                      </a>
                    ) : null}
                    {generation.outputUrl ? (
                      <Link
                        href={`/create?from=${generation.id}&format=whatsapp_status`}
                        className="text-sm font-semibold text-slate-600"
                      >
                        Décliner en statut WhatsApp
                      </Link>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
