import type { ReactNode } from "react";
import Image from "next/image";
import { Bebas_Neue } from "next/font/google";
import { BrandLogo } from "@/components/brand/logo";

const display = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
});

const POSTERS = [
  {
    src: "/creations/mode-01.webp",
    width: 896,
    height: 1200,
    alt: "Affiche d'exemple FlyerMint pour une collection de mode, avec une femme en robe blanche.",
    className: "cover-side cover-side-left",
    priority: false,
  },
  {
    src: "/creations/mode-02.webp",
    width: 896,
    height: 1200,
    alt: "Affiche d'exemple FlyerMint pour une collection de mode, portrait d'une femme.",
    className: "cover-side cover-side-right",
    priority: false,
  },
  {
    src: "/creations/evenementiel-03.webp",
    width: 896,
    height: 1200,
    alt: "Affiche d'exemple FlyerMint pour un concert, avec un jeune homme au premier plan.",
    className: "cover-hero",
    priority: true,
  },
] as const;

const LEAVES = ["leaf-a", "leaf-b", "leaf-c", "leaf-d", "leaf-e"];

function MintLeaf({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 64 80" width="42" height="52" aria-hidden="true">
      <path
        d="M32 74c0 0-22-22-22-42C10 16 20 6 32 10 44 6 54 16 54 32 54 52 32 74 32 74Z"
        fill="#ECFDF5"
      />
      <path d="M32 66V18" stroke="#1E293B" strokeWidth="1.4" fill="none" />
      <path d="M32 30c-7-4-13-4-18-2M32 42c-8-3-14-2-18 2M32 52c-6-2-11-1-14 2" stroke="#1E293B" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

export function CoverScene({ bar, band }: { bar: ReactNode; band: ReactNode }) {
  return (
    <section className="cover-root">
      <header className="cover-bar">
        <BrandLogo size="sm" wordmark="ink" />
        {bar}
      </header>

      <div className="cover-stage-wrap">
        <p aria-hidden="true" className={`${display.className} cover-word`}>
          AFFICHE
        </p>
        <div className="cover-stage cover-enter">
          {LEAVES.map((name) => (
            <MintLeaf key={name} className={`cover-leaf ${name}`} />
          ))}
          {POSTERS.map((poster) => (
            <div key={poster.src} className={poster.className}>
              <Image
                src={poster.src}
                alt={poster.alt}
                width={poster.width}
                height={poster.height}
                priority={poster.priority}
                sizes={poster.priority ? "(max-width: 768px) 68vw, 280px" : "170px"}
                className="h-auto w-full"
              />
            </div>
          ))}
        </div>
        <p className="cover-caption">Exemples créés avec FlyerMint.</p>
      </div>

      <div className="cover-band">
        <h1>Décris ton événement ou ton offre. Reçois une affiche prête à publier.</h1>
        <p className="cover-lead">Tu réponds à quelques questions, FlyerMint compose l&apos;affiche, tu la télécharges.</p>
        {band}
        <ul className="cover-facts">
          <li>1 Mint offert à l&apos;inscription</li>
          <li>1 Mint = 1 affiche</li>
          <li>L&apos;export ne consomme aucun Mint</li>
        </ul>
      </div>
    </section>
  );
}
