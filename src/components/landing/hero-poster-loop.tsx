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
      <div className="absolute bottom-8 right-2 z-40 rounded-2xl bg-[#6D28D9] px-3 py-2 text-xs text-white shadow-[0_10px_24px_rgba(109,40,217,0.28)]">
        Direction artistique
        <p className="text-sm font-semibold">Hiérarchie · CTA · Safe zone</p>
      </div>
      <div className="absolute right-4 top-2 z-40 rounded-2xl bg-[#10B981] px-3 py-2 text-xs text-white shadow-[0_10px_24px_rgba(16,185,129,0.22)]">
        Mints
        <p className="text-lg font-bold">1 affiche offerte</p>
      </div>
    </div>
  );
}
