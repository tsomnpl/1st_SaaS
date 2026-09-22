import Link from "next/link";
import { VisualPoster } from "@/components/landing/visual-poster";
import { DOMAIN_LABELS, DOMAINS } from "@/lib/domains";
import { posterForDomaine, toPoster } from "@/lib/showcase";
import type { ShowcaseManifestEntry } from "@/lib/showcase-manifest";

export function DomainPosterGrid({ generated }: { generated: ShowcaseManifestEntry[] }) {
  const cards = DOMAINS.map((domain) => {
    const match = posterForDomaine(generated, domain) ?? posterForDomaine(generated, DOMAIN_LABELS[domain]);
    const poster = match && match.fichier_image ? toPoster(match) : null;
    return { domain, match, poster };
  });
  const withImage = cards.filter((card) => card.poster?.imageSrc);
  const empty = cards.length - withImage.length;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Tous les univers, un même niveau d’exigence</h2>
          <p className="mt-2 text-sm text-slate-600">
            {withImage.length} affiches réelles affichées
            {empty > 0 ? ` · ${empty} catégories sans création` : ""}.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {cards.map(({ domain, match, poster }) => {
          if (poster?.imageSrc && match) {
            return (
              <Link
                key={domain}
                href={`/affiche/${match.id}`}
                className="block rounded-card transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <VisualPoster
                  {...poster}
                  domainLabel={DOMAIN_LABELS[domain]}
                  requireImage
                  className="min-h-[180px]"
                />
              </Link>
            );
          }
          return (
            <div key={domain} className="rounded-card">
              <VisualPoster
                title={DOMAIN_LABELS[domain]}
                domainLabel={DOMAIN_LABELS[domain]}
                requireImage
                className="min-h-[180px]"
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
