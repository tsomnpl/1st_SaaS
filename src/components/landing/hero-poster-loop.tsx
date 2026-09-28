import { VisualPoster } from "@/components/landing/visual-poster";

export type HeroPoster = {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  cta?: string;
  tone?: string;
  imageSrc?: string;
};

export function HeroPosterLoop({ posters }: { posters: HeroPoster[] }) {
  const visible = posters.filter((poster) => poster.imageSrc).slice(0, 3);
  if (visible.length < 1) return null;

  return (
    <div className="relative mx-auto grid w-full max-w-[440px] grid-cols-3 items-end gap-3">
      {visible.map((poster) => (
        <VisualPoster
          key={poster.id}
          title={poster.title}
          subtitle={poster.subtitle}
          imageSrc={poster.imageSrc}
        />
      ))}
    </div>
  );
}
