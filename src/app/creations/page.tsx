import type { Metadata } from "next";
import Link from "next/link";
import { pageTitle } from "@/lib/seo";
import { VisualPoster } from "@/components/landing/visual-poster";
import { DOMAIN_LABELS, DOMAINS } from "@/lib/domains";
import { SHOWCASE_SHEETS } from "@/lib/showcase-sheets";
import { getGeneratedShowcase, toPoster } from "@/lib/showcase";

export const metadata: Metadata = {
  title: pageTitle("Créations"),
  description: "Exemples d’affiches FlyerMint par domaine.",
  openGraph: { title: "Créations — FlyerMint" },
};

export default async function CreationsPage() {
  const { generated, manifest } = await getGeneratedShowcase();
  const posters = SHOWCASE_SHEETS.map((sheet) => {
    const entry = generated.find((item) => item.id === sheet.id);
    return entry
      ? toPoster(entry)
      : {
          id: sheet.id,
          title: sheet.titre_affiche_finale,
          subtitle: sheet.sous_titre_affiche_finale,
          meta: sheet.meta,
          cta: sheet.cta,
          tone: sheet.tone,
          imageSrc: undefined,
          domaine: sheet.domaine,
        };
  });
  const realImages = posters.filter((poster) => poster.imageSrc).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Créations</h1>
          <p className="mt-2 max-w-xl text-slate-600">
            {realImages === 27
              ? "27 affiches générées à partir du catalogue FlyerMint."
              : `${realImages}/27 affiches générées pour le moment. Les autres restent en attente de génération Rodium.`}
          </p>
        </div>
        <Link href="/create" className="btn-primary">
          Créer une affiche
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {posters.map((poster) => (
          <div key={poster.id} className="space-y-2">
            <VisualPoster {...poster} />
            <p className="text-xs text-slate-500">{poster.domaine}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400">
        Manifeste : {manifest?.count ?? 0} entrées · RODI {manifest?.rodi_total ?? 0}
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {DOMAINS.map((domain) => (
          <Link key={domain} href="/create" className="rounded-2xl border border-slate-200 bg-white px-3 py-4 text-center text-sm font-semibold hover:border-violet-200 hover:text-[#6D28D9]">
            {DOMAIN_LABELS[domain]}
          </Link>
        ))}
      </div>
    </div>
  );
}
