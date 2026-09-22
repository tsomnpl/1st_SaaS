import type { Metadata } from "next";
import Link from "next/link";
import { pageTitle } from "@/lib/seo";
import { VisualPoster } from "@/components/landing/visual-poster";
import { getLandingVisualsSafe } from "@/lib/landing-visuals";

export const metadata: Metadata = {
  title: pageTitle("Créations"),
  description: "Exemples d’affiches FlyerMint par domaine.",
  openGraph: { title: "Créations — FlyerMint" },
};

export default async function CreationsPage() {
  const visuals = await getLandingVisualsSafe();
  const realCount = visuals.realPosters.length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Créations</h1>
          <p className="mt-2 max-w-xl text-slate-600">
            {visuals.error
              ? "Impossible de charger les créations."
              : realCount
                ? `${realCount} affiches réelles. Les univers sans visuel n’apparaissent pas ici.`
                : "Aucune création disponible pour le moment."}
          </p>
        </div>
        <Link href="/create" className="btn-primary">
          Créer une affiche
        </Link>
      </div>

      {visuals.error ? (
        <VisualPoster title="Créations" state="error" className="max-w-[240px]" />
      ) : realCount ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {visuals.realPosters.map((poster) => (
            <div key={poster.id} className="space-y-2">
              <VisualPoster
                title={`${poster.title}${poster.subtitle ? ` — ${poster.subtitle}` : ""}`}
                imageSrc={poster.imageSrc}
                overlayLabel={poster.title}
              />
              <p className="text-xs text-slate-500">{poster.domaine}</p>
            </div>
          ))}
        </div>
      ) : (
        <VisualPoster title="Galerie" state="empty" className="max-w-[240px]" />
      )}

      {visuals.domains.length ? (
        <section className="space-y-4">
          <h2 className="text-xl font-extrabold">Par domaine</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {visuals.domains.map(({ domain, label, poster }) => (
              <Link
                key={domain}
                href={`/create?domain=${encodeURIComponent(domain)}`}
                aria-label={`Créer une affiche ${label}`}
              >
                <VisualPoster title={label} imageSrc={poster.imageSrc} overlayLabel={label} />
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
