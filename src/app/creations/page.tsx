import type { Metadata } from "next";
import Link from "next/link";
import { pageTitle } from "@/lib/seo";
import { VisualPoster } from "@/components/landing/visual-poster";
import posters from "@/lib/exact-domain-posters.json";

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
            {posters.length} domaines. Chaque affiche est la référence choisie dans son dossier Supabase, sans redessin : même image, même texte, même police, même fond.
          </p>
        </div>
        <Link href="/create" className="btn-primary">
          Créer une affiche
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {posters.map((poster) => (
          <div key={poster.id} className="space-y-2">
            <VisualPoster
              title={poster.label}
              subtitle={poster.domaine}
              imageSrc={poster.src}
            />
            <p className="text-xs text-slate-500">{poster.label}</p>
          </div>
        ))}
      </div>
      <p className="text-sm text-slate-500">
        22 dossiers. Aucune de ces affiches n’a été redessinée.
      </p>
    </div>
  );
}
