import type { Metadata } from "next";
import Link from "next/link";
import { pageTitle } from "@/lib/seo";
import { VisualPoster } from "@/components/landing/visual-poster";
import { EXACT_SHOWCASE } from "@/lib/exact-showcase";

export const metadata: Metadata = {
  title: pageTitle("Créations"),
  description: "Exemples d’affiches FlyerMint par domaine.",
  openGraph: { title: "Créations, FlyerMint" },
};

export default function CreationsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Créations</h1>
          <p className="mt-2 max-w-xl text-slate-600">
            Copie exacte : même image, même texte, même police, même fond. Le texte ou le logo changent seulement quand le client les apporte.
          </p>
        </div>
        <Link href="/create" className="btn-primary">
          Créer une affiche
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {EXACT_SHOWCASE.map((poster) => (
          <div key={poster.id} className="space-y-2">
            <VisualPoster title={poster.title} subtitle={poster.subtitle} meta={poster.meta} cta={poster.cta} imageSrc={poster.src} />
            <p className="text-xs text-slate-500">{poster.domaine}</p>
          </div>
        ))}
      </div>
      <p className="text-sm text-slate-500">
        Sans texte ni logo apportés par le client, l’affiche reste celle de la référence.
      </p>
    </div>
  );
}
