import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pageTitle } from "@/lib/seo";
import { getGeneratedShowcase, isVerified4k, sheetFor, toPoster } from "@/lib/showcase";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const sheet = sheetFor(id);
  return { title: pageTitle(sheet?.titre_affiche_finale ?? "Affiche") };
}

export default async function AffichePage({ params }: { params: Params }) {
  const { id } = await params;
  const { generated } = await getGeneratedShowcase();
  const entry = generated.find((item) => item.id === id);
  if (!entry?.fichier_image) notFound();
  const poster = toPoster(entry);
  const fourK = isVerified4k(entry);
  const master =
    entry.master_width && entry.master_height ? `${entry.master_width}×${entry.master_height}` : "";

  return (
    <div className="page-canvas mx-auto max-w-3xl space-y-4">
      <Link href="/creations" className="text-sm font-semibold text-violet">
        Retour aux créations
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-night">{poster.title}</h1>
          {poster.subtitle ? <p className="mt-1 text-slate-600">{poster.subtitle}</p> : null}
        </div>
        {fourK ? (
          <span className="rounded-full bg-violet/10 px-3 py-1 text-xs font-bold text-violet">
            4K{master ? ` · ${master}` : ""}
          </span>
        ) : null}
      </div>
      <img
        src={poster.imageSrc}
        alt={`${poster.title}${poster.subtitle ? ` — ${poster.subtitle}` : ""}`}
        className="mx-auto w-full rounded-card border border-slate-200 bg-white"
      />
      <p className="text-sm text-slate-500">{poster.domaine}</p>
    </div>
  );
}
