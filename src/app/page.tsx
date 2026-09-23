import Link from "next/link";
import { STEPS } from "@/lib/brand";
import { formatFcfa, paidPlans } from "@/lib/plans";
import { VisualPoster } from "@/components/landing/visual-poster";
import { HeroPosterLoop } from "@/components/landing/hero-poster-loop";
import { LandingBriefTeaser } from "@/components/landing/brief-teaser";
import { DomainPosterGrid } from "@/components/landing/domain-poster-grid";
import {
  getGeneratedShowcase,
  pickAfterPoster,
  pickLandingShowcase,
  toPoster,
} from "@/lib/showcase";

export default async function Home() {
  const { generated } = await getGeneratedShowcase();
  const heroPosters = generated
    .filter((entry) => entry.hero_loop)
    .map((entry) => toPoster(entry, true))
    .filter((poster) => poster.imageSrc);
  const landingShowcase = pickLandingShowcase(generated)
    .map((entry) => toPoster(entry))
    .filter((poster) => poster.imageSrc);
  const after = pickAfterPoster(generated);
  const afterPoster = after ? toPoster(after) : null;

  return (
    <div className="space-y-24 pb-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white px-5 py-10 shadow-[0_30px_80px_rgba(15,23,42,0.08)] md:px-10 md:py-14">
        <div className="pointer-events-none absolute -left-16 top-0 h-56 w-56 rounded-full bg-violet/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-mint/10 blur-3xl" />

        <div className="relative grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="inline-flex items-center justify-center rounded-full border border-violet/20 bg-violet/10 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet">
              DIRECTION ARTISTIQUE INCLUSE
            </p>
            <h1 className="mt-5 max-w-xl text-4xl font-extrabold leading-[1.05] tracking-tight text-night md:text-6xl">
              Ton idée. Une affiche qui se remarque.
            </h1>
            <p className="mt-4 text-lg font-medium text-violet">
              Créez des visuels qui marquent.
            </p>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-600 md:text-lg">
              Tu décris ce que tu veux communiquer. FlyerMint pose les bonnes questions,
              compose le visuel et te rend une affiche professionnelle — sans designer, sans prompt.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/create" className="btn-primary px-6 py-3">
                Créer une affiche
              </Link>
              <Link href="/creations" className="btn-secondary px-6 py-3">
                Voir les créations
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1">1 Mint = 1 affiche</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1">1 Mint offert à l’inscription</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1">L’export ne consomme rien</span>
            </div>
          </div>

          {heroPosters.length >= 3 ? (
            <HeroPosterLoop posters={heroPosters} />
          ) : (
            <div className="relative mx-auto flex h-[440px] w-full max-w-[440px] items-center justify-center rounded-card border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <p className="text-sm text-slate-500">
                Les affiches du hero se chargent dès que trois créations générées sont disponibles.
              </p>
            </div>
          )}
        </div>
      </section>

      <section id="creations" className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet">Showcase</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Des affiches, pas des cartes vides.</h2>
          </div>
          <Link href="/creations" className="text-sm font-semibold text-violet hover:underline">
            Toute la galerie
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {landingShowcase.length === 0 ? (
            <p className="col-span-full rounded-card border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
              Aucune création disponible pour le moment.
            </p>
          ) : (
            landingShowcase.map((poster) => (
              <Link
                key={poster.id ?? poster.title}
                href={`/affiche/${poster.id}`}
                className="block rounded-card transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <VisualPoster {...poster} requireImage />
              </Link>
            ))
          )}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet">Avant / Après</p>
          <h3 className="mt-2 text-2xl font-extrabold">D’un message brut à un visuel qui vend</h3>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Avant</p>
              <p className="mt-3 font-mono text-sm leading-relaxed text-slate-500">
                Promo ce weekend, burger + boisson, 5000 FCFA, appelle ce numero.
              </p>
            </div>
            {afterPoster?.imageSrc ? (
              <VisualPoster {...afterPoster} className="min-h-[220px]" requireImage />
            ) : (
              <div className="flex min-h-[220px] items-center justify-center rounded-card border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
                Aucune création disponible pour l’exemple Après.
              </div>
            )}
          </div>
        </article>
        <article className="card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mint">Questionnaire</p>
          <h3 className="mt-2 text-2xl font-extrabold">Tu réponds. On compose.</h3>
          <p className="mt-2 text-sm text-slate-600">
            Trois infos suffisent pour ouvrir le brief. Le reste se pose ensuite, domaine par domaine.
          </p>
          <div className="mt-6">
            <LandingBriefTeaser />
          </div>
        </article>
      </section>

      <section id="comment-ca-marche">
        <h2 className="text-3xl font-extrabold tracking-tight">Comment ça marche</h2>
        <p className="mt-2 max-w-2xl text-slate-600">
          Un parcours simple : idée → questions → direction artistique → génération → contrôle → affiche.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((item) => (
            <article key={item.n} className="card p-5">
              <p className="text-xs font-bold text-violet">{item.n}</p>
              <h3 className="mt-2 text-lg font-bold">{item.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card p-6 md:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet">Direction artistique IA</p>
        <h2 className="mt-2 text-3xl font-extrabold">Un directeur artistique, pas un bouton magique</h2>
        <p className="mt-3 max-w-2xl text-slate-600">
          FlyerMint analyse le domaine, s’appuie sur des principes de design et une bibliothèque privée,
          place une personne réelle dans la scène, génère, contrôle, puis corrige si besoin.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            "Personne obligatoire, avec un rôle dans l’affiche",
            "Palette 2-3 couleurs, 2 typo max, safe zone",
            "Contrôle qualité + une réparation incluse",
          ].map((item) => (
            <p key={item} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {item}
            </p>
          ))}
        </div>
      </section>

      <DomainPosterGrid generated={generated} />

      <section id="tarifs" className="card p-6 md:p-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet">Tarifs</p>
            <h2 className="mt-2 text-3xl font-extrabold">1 Mint = 1 affiche</h2>
            <p className="mt-2 text-slate-600">L’export ne consomme aucun Mint.</p>
          </div>
          <Link href="/pricing" className="btn-primary">
            Choisir une offre
          </Link>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {paidPlans().map((plan) => (
            <Link
              key={plan.code}
              href={`/checkout?plan=${plan.code}`}
              className={`rounded-card border p-5 transition hover:-translate-y-0.5 hover:shadow-md ${
                plan.highlighted ? "border-violet/30 bg-violet/5" : "border-slate-200 bg-slate-50"
              }`}
            >
              <p className="text-2xl font-extrabold text-night">{formatFcfa(plan.priceFcfa)}</p>
              <p className="mt-1 font-semibold text-violet">
                {plan.mintAmount} Mints
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {plan.durationDays ? `Valables ${plan.durationDays} jours` : "Sans expiration"}
                {plan.editableExport ? " · pack éditable" : ""}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section id="export-editable" className="card p-6 md:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mint">Export éditable</p>
        <h2 className="mt-2 text-3xl font-extrabold">Figma, Canva, Word — seulement sur les packs 20k et 25k</h2>
        <p className="mt-3 max-w-2xl text-slate-600">
          L’export éditable est proposé uniquement si le fichier est réellement disponible pour ta génération.
          Il ne consomme aucun Mint. Les offres 2k à 15k livrent l’affiche finale, pas le fichier source.
        </p>
        <Link href="/pricing" className="btn-secondary mt-6 inline-flex">
          Voir les packs éditables
        </Link>
      </section>

      <section className="rounded-card bg-night px-8 py-12 text-center text-white md:px-12">
        <h2 className="text-3xl font-extrabold md:text-4xl">Prêt à lancer ta prochaine affiche ?</h2>
        <p className="mx-auto mt-3 max-w-xl text-white/70">
          Simple, rapide, premium. Tu n’as pas besoin de savoir designer.
        </p>
        <Link href="/create" className="btn-mint mt-6">
          Créer une affiche
        </Link>
      </section>
    </div>
  );
}
