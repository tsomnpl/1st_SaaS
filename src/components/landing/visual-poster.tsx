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
  /** When true (default for gallery), skip the card if there is no real image. */
  requireImage?: boolean;
};

export function VisualPoster({
  title,
  subtitle,
  imageSrc,
  className = "",
  requireImage = true,
}: VisualPosterProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(imageSrc) && !failed;

  if (!showImage) {
    if (requireImage) return null;
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
    <article className={`relative aspect-[3/4] overflow-hidden rounded-card bg-slate-100 ${className}`}>
      <img
        src={imageSrc}
        alt={`${title}${subtitle ? ` — ${subtitle}` : ""}`}
        className="absolute inset-0 h-full w-full object-cover"
        loading="eager"
        decoding="async"
        onError={() => setFailed(true)}
      />
    </article>
  );
}
