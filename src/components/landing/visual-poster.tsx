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
  className?: string;
};

const tones: Record<PosterTone, string> = {
  night: "from-[#0b1220] via-[#1b2a4a] to-[#20C997]/40",
  warm: "from-[#2a160c] via-[#7a3b12] to-[#f4b942]",
  gold: "from-[#14110c] via-[#3b2a12] to-[#d4b483]",
  clean: "from-[#102033] via-[#1d4e63] to-[#7dd3c7]",
  sport: "from-[#111827] via-[#1f2937] to-[#ef4444]/50",
  soft: "from-[#1a1423] via-[#4c1d3d] to-[#f9a8d4]/40",
  dark: "from-[#0a0a0a] via-[#1f2937] to-[#20C997]/30",
  fresh: "from-[#06251f] via-[#0f766e] to-[#DFFAF0]/40",
  rose: "from-[#2a1020] via-[#7f1d4a] to-[#fda4af]/40",
  earth: "from-[#1c1917] via-[#365314] to-[#a3e635]/30",
};

export function VisualPoster({
  kicker = "FlyerMint",
  title,
  subtitle,
  meta,
  cta = "Reserver",
  tone = "night",
  className = "",
}: VisualPosterProps) {
  return (
    <article
      className={`relative flex aspect-[3/4] flex-col overflow-hidden rounded-[1.4rem] border border-white/15 bg-gradient-to-br p-4 shadow-[0_20px_50px_rgba(0,0,0,0.35)] ${tones[tone]} ${className}`}
    >
      <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
      <p className="text-[10px] uppercase tracking-[0.22em] text-white/70">{kicker}</p>
      <h3 className="mt-3 max-w-[12ch] text-2xl font-semibold leading-none text-white">{title}</h3>
      {subtitle ? <p className="mt-2 text-sm text-white/80">{subtitle}</p> : null}
      <div className="mt-auto space-y-3">
        {meta ? <p className="text-xs text-white/70">{meta}</p> : null}
        <span className="inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-[#111827]">
          {cta}
        </span>
      </div>
    </article>
  );
}
