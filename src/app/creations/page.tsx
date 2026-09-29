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
            {posters.length} domaines. Chaque affiche garde la photo et la composition de sa référence. Les noms, numéros, dates et lieux réels sont retirés. Les visages restent flous sur l’anniversaire et le mariage.
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
        22 dossiers. Les coordonnées personnelles des références ne sont pas affichées.
      </p>
    </div>
  );
}
