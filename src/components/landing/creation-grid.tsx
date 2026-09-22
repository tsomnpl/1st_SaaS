"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { VisualPoster, type VisualPosterProps } from "@/components/landing/visual-poster";

export type GalleryPoster = VisualPosterProps & {
  id: string;
  domaine?: string;
  fourK?: boolean;
};

export function CreationGrid({ posters }: { posters: GalleryPoster[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const current = posters.find((poster) => poster.id === openId && poster.imageSrc);

  useEffect(() => {
    if (!current) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current]);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {posters.map((poster) => (
          <div key={poster.id} className="space-y-2">
            <Link
              href={poster.imageSrc ? `/affiche/${poster.id}` : "/creations"}
              className="block w-full rounded-card text-left transition hover:-translate-y-0.5 hover:shadow-lg"
              aria-label={poster.imageSrc ? `Ouvrir ${poster.title}` : poster.title}
              onClick={(event) => {
                if (!poster.imageSrc) return;
                event.preventDefault();
                setOpenId(poster.id);
              }}
            >
              <VisualPoster {...poster} requireImage />
            </Link>
            <p className="text-xs text-slate-500">{poster.domaine}</p>
          </div>
        ))}
      </div>
      {current?.imageSrc ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-night/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={current.title}
          onClick={() => setOpenId(null)}
        >
          <div
            className="card relative max-h-[92vh] w-full max-w-3xl overflow-auto bg-white p-3"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-night">{current.title}</p>
                {current.subtitle ? <p className="text-xs text-slate-500">{current.subtitle}</p> : null}
              </div>
              <div className="flex items-center gap-2">
                {current.fourK ? (
                  <span className="rounded-full bg-violet/10 px-2 py-1 text-[11px] font-bold text-violet">4K</span>
                ) : null}
                <Link href={`/affiche/${current.id}`} className="text-sm font-semibold text-violet">
                  Page dédiée
                </Link>
                <button type="button" className="btn-secondary px-3 py-1.5" onClick={() => setOpenId(null)}>
                  Fermer
                </button>
              </div>
            </div>
            <img
              src={current.imageSrc}
              alt={`${current.title}${current.subtitle ? ` — ${current.subtitle}` : ""}`}
              className="mx-auto max-h-[75vh] w-auto rounded-card"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
