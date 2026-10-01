import type { Metadata } from "next";
import Link from "next/link";
import { pageTitle } from "@/lib/seo";
import { getDictionary } from "@/lib/locale";
import { VisualPoster } from "@/components/landing/visual-poster";
import posters from "@/lib/exact-domain-posters.json";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return {
    title: pageTitle(t.creations.title),
    description: t.creations.note,
    openGraph: { title: `${t.creations.title}, FlyerMint` },
  };
}

export default async function CreationsPage() {
  const { t } = await getDictionary();
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">{t.creations.title}</h1>
          <p className="mt-2 max-w-xl text-slate-600">
            {posters.length} {t.creations.intro}
          </p>
        </div>
        <Link href="/create" className="btn-primary">
          {t.nav.create}
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
        {t.creations.note}
      </p>
    </div>
  );
}
