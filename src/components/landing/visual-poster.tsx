"use client";

import { useState } from "react";

export type PosterState = "ready" | "loading" | "empty" | "error";

export type VisualPosterProps = {
  title: string;
  imageSrc?: string;
  overlayLabel?: string;
  state?: PosterState;
  emptyMessage?: string;
  className?: string;
};

const frame =
  "relative flex aspect-[3/4] flex-col overflow-hidden rounded-[1.5rem] shadow-[0_24px_50px_rgba(15,23,42,0.12)]";

export function VisualPoster({
  title,
  imageSrc,
  overlayLabel,
  state,
  emptyMessage = "Aucune création disponible pour cette catégorie.",
  className = "",
}: VisualPosterProps) {
  const [failed, setFailed] = useState(false);
  const resolved: PosterState =
    state ?? (imageSrc ? (failed ? "error" : "ready") : "empty");

  if (resolved === "loading") {
    return (
      <article
        className={`${frame} animate-pulse border border-slate-200 bg-slate-100 p-5 ${className}`}
        aria-busy="true"
        aria-label="Chargement des créations"
      >
        <div className="h-3 w-24 rounded bg-slate-200" />
        <div className="mt-auto space-y-2">
          <div className="h-3 w-3/4 rounded bg-slate-200" />
          <p className="text-xs font-medium text-slate-400">Chargement des créations…</p>
        </div>
      </article>
    );
  }

  if (resolved === "error") {
    return (
      <article
        className={`${frame} border border-dashed border-rose-200 bg-rose-50 p-5 ${className}`}
        role="status"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-400">FlyerMint</p>
        <p className="mt-auto text-sm font-semibold text-rose-700">Impossible de charger les créations.</p>
      </article>
    );
  }

  if (resolved === "empty" || !imageSrc) {
    return (
      <article
        className={`${frame} border border-dashed border-slate-200 bg-slate-50 p-5 ${className}`}
        role="status"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">FlyerMint</p>
        <h3 className="relative mt-4 text-base font-bold leading-tight text-slate-700">{title}</h3>
        <p className="mt-auto text-sm font-medium text-slate-500">{emptyMessage}</p>
      </article>
    );
  }

  return (
    <article className={`${frame} bg-slate-200 ${className}`}>
      <img
        src={imageSrc}
        alt={title}
        className="absolute inset-0 h-full w-full object-cover"
        loading="eager"
        decoding="async"
        onError={() => setFailed(true)}
      />
      {overlayLabel ? (
        <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/75 via-black/25 to-transparent px-4 pb-4 pt-16">
          <p className="text-sm font-bold tracking-tight text-white">{overlayLabel}</p>
        </div>
      ) : null}
    </article>
  );
}
