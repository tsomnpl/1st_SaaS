export type VisualPosterProps = {
  kicker?: string;
  title: string;
  subtitle?: string;
  meta?: string;
  cta?: string;
  tone?: string;
  imageSrc?: string;
  className?: string;
};

export function VisualPoster({
  title,
  subtitle,
  meta,
  imageSrc,
  className = "",
}: VisualPosterProps) {
  if (!imageSrc) {
    return (
      <article className={`flex aspect-[3/4] flex-col justify-end rounded-lg border border-slate-200 bg-slate-50 p-4 text-[#1E293B] ${className}`}>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Affiche</p>
        <h3 className="mt-2 text-lg font-bold">{title}</h3>
        {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
        {meta ? <p className="mt-2 text-xs text-slate-500">{meta}</p> : null}
      </article>
    );
  }

  return (
    <article className={`relative aspect-[3/4] overflow-hidden rounded-lg border border-slate-200 bg-slate-50 ${className}`}>
      <img
        src={imageSrc}
        alt={subtitle ? `${title}, ${subtitle}` : title}
        className="h-full w-full object-cover"
        width={896}
        height={1200}
        decoding="async"
      />
    </article>
  );
}
