type PosterTone =
  | "night"
  | "warm"
  | "gold"
  | "clean"
  | "sport"
  | "soft"
  | "dark"
  | "fresh"
  | "rose"
  | "earth";

export type VisualPosterProps = {
  kicker?: string;
  title: string;
  subtitle?: string;
  meta?: string;
  cta?: string;
  tone?: PosterTone;
  imageSrc?: string;
  className?: string;
};

const tones: Record<PosterTone, string> = {
  night: "from-[#0f172a] via-[#312e81] to-[#6D28D9]",
  warm: "from-[#7c2d12] via-[#c2410c] to-[#F59E0B]",
  gold: "from-[#1E293B] via-[#334155] to-[#d4b483]",
  clean: "from-[#0f766e] via-[#3B82F6] to-[#e0f2fe]",
  sport: "from-[#1E293B] via-[#b91c1c] to-[#F59E0B]",
  soft: "from-[#4c1d95] via-[#9d174d] to-[#f9a8d4]",
  dark: "from-[#020617] via-[#1E293B] to-[#10B981]",
  fresh: "from-[#064e3b] via-[#10B981] to-[#d1fae5]",
  rose: "from-[#4c0519] via-[#be123c] to-[#fda4af]",
  earth: "from-[#1c1917] via-[#3f6212] to-[#a3e635]",
};

export function VisualPoster({
  kicker = "FlyerMint",
  title,
  subtitle,
  meta,
  cta = "Réserver",
  tone = "night",
  imageSrc,
  className = "",
}: VisualPosterProps) {
  return (
    <article
      className={`relative flex aspect-[3/4] flex-col overflow-hidden rounded-[1.5rem] bg-gradient-to-br p-5 text-white shadow-[0_24px_50px_rgba(15,23,42,0.18)] ${tones[tone]} ${className}`}
    >
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={`${title}${subtitle ? ` — ${subtitle}` : ""}`}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : null}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/20" />
      <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
      <div className="pointer-events-none absolute bottom-8 left-[-20%] h-24 w-40 rounded-full bg-black/10 blur-2xl" />
      <p className="relative z-10 text-[10px] uppercase tracking-[0.22em] text-white/70">{kicker}</p>
      <h3 className="relative mt-4 max-w-[11ch] text-[1.65rem] font-extrabold leading-[0.95] tracking-tight">
        {title}
      </h3>
      {subtitle ? <p className="relative mt-3 max-w-[18ch] text-sm text-white/85">{subtitle}</p> : null}
      <div className="relative mt-auto space-y-3">
        {meta ? (
          <p className="max-w-[20ch] text-xs font-medium text-white/75">{meta}</p>
        ) : null}
        <span className="inline-flex rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-[#1E293B]">
          {cta}
        </span>
      </div>
    </article>
  );
}
