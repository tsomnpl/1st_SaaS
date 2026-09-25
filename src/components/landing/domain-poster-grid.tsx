import Link from "next/link";
import { VisualPoster } from "@/components/landing/visual-poster";
import { DOMAIN_LABELS, DOMAINS } from "@/lib/domains";
import { posterForDomaine, toPoster } from "@/lib/showcase";
import type { ShowcaseManifestEntry } from "@/lib/showcase-manifest";

export function DomainPosterGrid({ generated }: { generated: ShowcaseManifestEntry[] }) {
  const cards = DOMAINS.flatMap((domain) => {
    const match = posterForDomaine(generated, domain) ?? posterForDomaine(generated, DOMAIN_LABELS[domain]);
    if (!match?.fichier_image) return [];
    const poster = toPoster(match);
    if (!poster.imageSrc) return [];
    return [{ domain, match, poster }];
  });

  if (cards.length === 0) return null;

  return (
    <section className="space-y-6">
      <h2 className="text-3xl font-extrabold tracking-tight">Tous les univers, un même niveau d’exigence</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {cards.map(({ domain, match, poster }) => (
          <Link
            key={domain}
            href={`/affiche/${match.id}`}
            className="block overflow-hidden rounded-card"
          >
            <VisualPoster {...poster} requireImage />
          </Link>
        ))}
      </div>
    </section>
  );
}
