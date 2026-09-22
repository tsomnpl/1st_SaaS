import type { Metadata } from "next";
import Link from "next/link";
import { pageTitle } from "@/lib/seo";
import { CreationGrid } from "@/components/landing/creation-grid";
import { DOMAIN_LABELS, DOMAINS } from "@/lib/domains";
import { SHOWCASE_SHEETS } from "@/lib/showcase-sheets";
import { getGeneratedShowcase, isVerified4k, toPoster } from "@/lib/showcase";

export const metadata: Metadata = {
  title: pageTitle("Créations"),
  description: "Exemples d’affiches FlyerMint par domaine.",
  openGraph: { title: "Créations — FlyerMint" },
};

export default async function CreationsPage() {
  const { generated } = await getGeneratedShowcase();
  const posters = SHOWCASE_SHEETS.map((sheet) => {
    const entry = generated.find((item) => item.id === sheet.id);
    return entry?.fichier_image
      ? { ...toPoster(entry), fourK: isVerified4k(entry) }
      : {
          id: sheet.id,
          title: sheet.titre_affiche_finale,
          subtitle: sheet.sous_titre_affiche_finale,
          meta: sheet.meta,
          cta: sheet.cta,
          tone: sheet.tone,
          imageSrc: undefined,
          domaine: sheet.domaine,
          fourK: false,
        };
  }).filter((poster) => poster.imageSrc);
  const realImages = posters.length;

  return (
    <div className="page-canvas space-y-8">
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
      <CreationGrid posters={posters} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {DOMAINS.map((domain) => (
          <Link key={domain} href="/create" className="rounded-card border border-slate-200 bg-white px-3 py-4 text-center text-sm font-semibold hover:border-violet/30 hover:text-violet">
            {DOMAIN_LABELS[domain]}
          </Link>
        ))}
      </div>
    </div>
  );
}
