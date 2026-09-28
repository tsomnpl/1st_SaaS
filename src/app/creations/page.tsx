import type { Metadata } from "next";
import Link from "next/link";
import { pageTitle } from "@/lib/seo";
import { VisualPoster } from "@/components/landing/visual-poster";
import { SHOWCASE_SHEETS } from "@/lib/showcase-sheets";
import { getGeneratedShowcase, toPoster } from "@/lib/showcase";

export const metadata: Metadata = {
  title: pageTitle("Créations"),
  description: "Exemples d’affiches FlyerMint par domaine.",
  openGraph: { title: "Créations, FlyerMint" },
};

export default async function CreationsPage() {
  const { generated } = await getGeneratedShowcase();
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
  const visible = posters.filter((poster) => poster.imageSrc);
  const byDomain = new Map<string, (typeof visible)[number]>();
  for (const poster of visible) {
    if (poster.domaine && !byDomain.has(poster.domaine)) byDomain.set(poster.domaine, poster);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Créations</h1>
          <p className="mt-2 max-w-xl text-slate-600">
            {visible.length} affiches réelles. Les univers sans visuel n&apos;apparaissent pas ici.
          </p>
        </div>
        <Link href="/create" className="btn-primary">
          Créer une affiche
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {visible.map((poster) => (
          <div key={poster.id} className="space-y-2">
            <VisualPoster {...poster} />
            <p className="text-xs text-slate-500">{poster.domaine}</p>
          </div>
        ))}
      </div>
      <section className="space-y-4">
        <h2 className="text-xl font-extrabold">Par domaine</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {[...byDomain.values()].map((poster) => (
            <div key={poster.id} className="space-y-2">
              <VisualPoster {...poster} />
              <p className="text-xs text-slate-500">{poster.domaine}</p>
            </div>
          ))}
        </div>
      </section>
      <p className="text-sm text-slate-500">Exemples créés avec FlyerMint.</p>
    </div>
  );
}
