"use client";

import { useState } from "react";

export type VisualPosterProps = {
  kicker?: string;
  title: string;
  subtitle?: string;
  meta?: string;
  cta?: string;
  tone?: string;
  imageSrc?: string;
  className?: string;
  domainLabel?: string;
  /** When true (default for gallery), never fake a poster with a gradient. */
  requireImage?: boolean;
};

export function VisualPoster({
  kicker = "FlyerMint",
  title,
  subtitle,
  imageSrc,
  className = "",
  requireImage = true,
}: VisualPosterProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(imageSrc) && !failed;

  if (!showImage && requireImage) return null;

  if (!showImage) {
    return (
      <article
        className={`relative flex aspect-[3/4] flex-col items-center justify-center overflow-hidden rounded-card border border-slate-200 bg-white p-5 text-center ${className}`}
      >
        <p className="text-sm font-semibold text-night">{title}</p>
        {subtitle ? <p className="mt-2 text-xs text-slate-500">{subtitle}</p> : null}
      </article>
    );
  }

  return (
    <article
      className={`relative flex aspect-[3/4] flex-col overflow-hidden rounded-card bg-slate-100 shadow-[0_24px_50px_rgba(15,23,42,0.18)] ${className}`}
    >
      <img
        src={imageSrc}
        alt={`${title}${subtitle ? ` — ${subtitle}` : ""}`}
        className="absolute inset-0 h-full w-full object-cover"
        loading="eager"
        decoding="async"
        onError={() => setFailed(true)}
      />
      <span className="relative z-10 ml-auto mt-3 mr-3 rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-night">
        {kicker}
      </span>
    </article>
  );
}
