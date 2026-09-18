import type { Metadata } from "next";
import Link from "next/link";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Créations"),
  description: "Exemples d’affiches FlyerMint par domaine.",
};
import { VisualPoster } from "@/components/landing/visual-poster";
import { DOMAIN_LABELS, DOMAINS } from "@/lib/domains";

const SHOWCASE = [
  { title: "NIGHT WAVE", subtitle: "Concert live", meta: "Sam. 21h · Plateau", tone: "night" as const, cta: "Prends ta place" },
  { title: "MENU DU SOIR", subtitle: "Burger + boisson", meta: "5 000 FCFA", tone: "warm" as const, cta: "Commander" },
  { title: "NOUVELLE COLLECTION", subtitle: "Lookbook été", meta: "Édition limitée", tone: "gold" as const, cta: "Découvrir" },
  { title: "VILLA VUE MER", subtitle: "Cocody", meta: "Visite ce week-end", tone: "clean" as const, cta: "Prendre RDV" },
  { title: "GLOW STUDIO", subtitle: "Soins visage", meta: "-30% cette semaine", tone: "soft" as const, cta: "Réserver" },
  { title: "OPEN DAY", subtitle: "Formation pro", meta: "Places limitées", tone: "fresh" as const, cta: "S’inscrire" },
  { title: "FLASH SALE", subtitle: "Boutique en ligne", meta: "24h seulement", tone: "sport" as const, cta: "Acheter" },
  { title: "YES I DO", subtitle: "Save the date", meta: "12 décembre", tone: "rose" as const, cta: "RSVP" },
];

export default function CreationsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Créations</h1>
          <p className="mt-2 max-w-xl text-slate-600">
            Des affiches pensées par domaine. À toi de créer la tienne.
          </p>
        </div>
        <Link href="/create" className="btn-primary">
          Créer une affiche
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {SHOWCASE.map((poster) => (
          <VisualPoster key={poster.title} {...poster} />
        ))}
      </div>
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
