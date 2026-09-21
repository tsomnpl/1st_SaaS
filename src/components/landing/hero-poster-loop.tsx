import { VisualPoster } from "@/components/landing/visual-poster";

export type HeroPoster = {
  id: string;
  title: string;
  subtitle?: string;
  overlayLabel?: string;
  imageSrc: string;
};

const TILTS = ["-rotate-6", "rotate-5", "-rotate-3", "rotate-4", "-rotate-5", "rotate-2"];

export function HeroPosterLoop({ posters }: { posters: HeroPoster[] }) {
  if (posters.length < 3) return null;
  const track = [...posters, ...posters];

  return (
    <div className="relative mx-auto h-[440px] w-full max-w-[440px] overflow-hidden">
      <div className="hero-loop-track">
        {track.map((poster, index) => (
          <VisualPoster
            key={`${poster.id}-${index}`}
            title={`${poster.title}${poster.subtitle ? ` — ${poster.subtitle}` : ""}`}
            imageSrc={poster.imageSrc}
            className={`w-[58%] max-w-[240px] ${TILTS[index % TILTS.length]} ${index % 2 ? "ml-auto" : "mr-auto"}`}
          />
        ))}
      </div>
      <div className="glass absolute bottom-8 right-2 z-40 rounded-2xl px-3 py-2 text-xs text-slate-600">
        Direction artistique
        <p className="text-sm font-semibold text-[#20C997]">Hiérarchie · CTA · Safe zone</p>
      </div>
      <div className="glass absolute right-4 top-2 z-40 rounded-2xl px-3 py-2 text-xs text-slate-600">
        Mints
        <p className="text-lg font-bold text-[#20C997]">1 affiche offerte</p>
      </div>
    </div>
  );
}
