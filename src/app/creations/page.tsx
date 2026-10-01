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
    <div className="space-y-16 pb-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="display-title">{t.creations.title}</h1>
          <p className="body-copy mt-4 max-w-xl text-slate-600">
            {posters.length} {t.creations.intro}
          </p>
        </div>
        <Link href="/create" className="btn-primary">
          {t.nav.create}
        </Link>
      </div>
      <div className="grid items-end gap-8 md:grid-cols-2">
        {posters.slice(0, 2).map((poster, index) => (
          <div key={poster.id} className={`space-y-3 ${index === 0 ? "md:-rotate-2" : "md:rotate-1 md:translate-y-6"}`}>
            <VisualPoster title={poster.label} subtitle={poster.domaine} imageSrc={poster.src} />
            <p className="text-sm text-slate-500">{poster.label}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
        {posters.slice(2).map((poster) => (
          <div key={poster.id} className="space-y-2">
            <VisualPoster title={poster.label} subtitle={poster.domaine} imageSrc={poster.src} />
            <p className="text-sm text-slate-500">{poster.label}</p>
          </div>
        ))}
      </div>
      <p className="text-sm text-slate-500">
        {t.creations.note}
      </p>
    </div>
  );
}
