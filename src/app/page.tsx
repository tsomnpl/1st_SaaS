import Link from "next/link";
import { STEPS } from "@/lib/brand";
import { formatFcfa, paidPlans } from "@/lib/plans";
import { VisualPoster } from "@/components/landing/visual-poster";
import { HeroPosterLoop } from "@/components/landing/hero-poster-loop";
import { getLandingVisualsSafe } from "@/lib/landing-visuals";

export default async function Home() {
  const visuals = await getLandingVisualsSafe();
  const galleryError = Boolean(visuals.error);
  const realCount = visuals.realPosters.length;

  return (
    <div className="space-y-24 pb-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white px-5 py-10 shadow-[0_30px_80px_rgba(15,23,42,0.08)] md:px-10 md:py-14">
        <div className="pointer-events-none absolute -left-16 top-0 h-56 w-56 rounded-full bg-[#6D28D9]/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-[#10B981]/10 blur-3xl" />

        <div className="relative grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="inline-flex rounded-2xl bg-[#6D28D9] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white">
              Direction artistique incluse
            </p>
            <h1 className="mt-5 max-w-xl text-4xl font-extrabold leading-[1.05] tracking-tight text-[#1E293B] md:text-6xl">
              Ton idée. Une affiche qui se remarque.
            </h1>
            <p className="mt-4 text-lg font-medium text-[#6D28D9]">
              Créez des visuels qui marquent.
            </p>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-600 md:text-lg">
              Tu décris ce que tu veux communiquer. FlyerMint observe des références visuelles,
              compose dans cette direction artistique et te rend une affiche professionnelle —
              sans designer, sans prompt.
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

          {galleryError ? (
            <VisualPoster title="Créations" state="error" className="mx-auto w-full max-w-[280px]" />
          ) : visuals.heroPosters.length >= 3 ? (
            <HeroPosterLoop posters={visuals.heroPosters} />
          ) : visuals.heroPosters[0] ? (
            <VisualPoster
              title={visuals.heroPosters[0].title}
              imageSrc={visuals.heroPosters[0].imageSrc}
              className="mx-auto w-full max-w-[280px]"
            />
          ) : (
            <VisualPoster title="Créations" state="empty" className="mx-auto w-full max-w-[280px]" />
          )}
        </div>
      </section>

      <section id="creations" className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6D28D9]">Showcase</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Des affiches, pas des cartes vides.</h2>
            <p className="mt-2 max-w-xl text-sm text-slate-500">
              {galleryError
                ? "Impossible de charger les créations."
                : realCount
                  ? `${realCount} affiches réelles issues des créations FlyerMint. Pas de dégradé à la place d’un visuel.`
                  : "Aucune création disponible pour le moment."}
            </p>
          </div>
          <Link href="/creations" className="text-sm font-semibold text-[#6D28D9] hover:underline">
            Toute la galerie
          </Link>
        </div>
        {galleryError ? (
          <VisualPoster title="Showcase" state="error" className="max-w-[240px]" />
        ) : visuals.showcase.length ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {visuals.showcase.map((poster) => (
              <VisualPoster
                key={poster.id}
                title={`${poster.title}${poster.subtitle ? ` — ${poster.subtitle}` : ""}`}
                imageSrc={poster.imageSrc}
                overlayLabel={poster.title}
              />
            ))}
          </div>
        ) : (
          <VisualPoster title="Showcase" state="empty" className="max-w-[240px]" />
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6D28D9]">Avant / Après</p>
          <h3 className="mt-2 text-2xl font-extrabold">D’un message brut à un visuel qui vend</h3>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Avant</p>
              <p className="mt-3 font-mono text-sm leading-relaxed text-slate-500">
                Promo ce weekend, burger + boisson, 5000 FCFA, appelle ce numero.
              </p>
            </div>
            {visuals.afterPoster ? (
              <VisualPoster
                title={visuals.afterPoster.title}
                imageSrc={visuals.afterPoster.imageSrc}
                overlayLabel="Après"
                className="min-h-[220px]"
              />
            ) : (
              <VisualPoster title="Après" state={galleryError ? "error" : "empty"} className="min-h-[220px]" />
            )}
          </div>
        </article>
        <article className="card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#10B981]">Questionnaire</p>
          <h3 className="mt-2 text-2xl font-extrabold">Tu réponds. On compose.</h3>
          <div className="mt-6 space-y-3">
            {[
              "Quel est ton domaine ?",
              "Que veux-tu que les gens fassent ?",
              "Quel est le message principal ?",
              "As-tu un style, des couleurs, une photo ?",
              "Quel format : story, post, affiche ?",
            ].map((question, index) => (
              <div
                key={question}
                className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-[#6D28D9]">
                  {index + 1}
                </span>
                {question}
              </div>
            ))}
          </div>
        </article>
      </section>

      <section id="comment-ca-marche">
        <h2 className="text-3xl font-extrabold tracking-tight">Comment ça marche</h2>
        <p className="mt-2 max-w-2xl text-slate-600">
          Un parcours simple : idée → questions → référence visuelle → direction artistique → génération → contrôle → affiche.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((item) => {
            const isArtDirection = item.title === "Direction artistique";
            return (
              <article
                key={item.n}
                className={`card p-5 ${isArtDirection ? "border-[#6D28D9]/25 bg-[#6D28D9] text-white" : ""}`}
              >
                <p className={`text-xs font-bold ${isArtDirection ? "text-white/80" : "text-[#6D28D9]"}`}>{item.n}</p>
                <h3 className="mt-2 text-lg font-bold">{item.title}</h3>
                <p className={`mt-1 text-sm ${isArtDirection ? "text-white/80" : "text-slate-600"}`}>{item.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      {visuals.domains.length ? (
        <section className="space-y-6">
          <h2 className="text-3xl font-extrabold tracking-tight">Tous les univers, un même niveau d’exigence</h2>
          <p className="max-w-2xl text-sm text-slate-500">
            Seulement les univers qui ont déjà une affiche réelle. Les autres restent dans le formulaire de
            création — jamais une tuile vide présentée comme une création.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {visuals.domains.map(({ domain, label, poster }) => (
              <Link key={domain} href={`/create?domain=${encodeURIComponent(domain)}`} aria-label={`Créer une affiche ${label}`}>
                <VisualPoster title={label} imageSrc={poster.imageSrc} overlayLabel={label} className="min-h-[180px]" />
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section id="tarifs" className="card p-6 md:p-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6D28D9]">Tarifs</p>
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
              className={`rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-md ${
                plan.highlighted ? "border-violet-200 bg-violet-50/70" : "border-slate-200 bg-slate-50"
              }`}
            >
              <p className="text-2xl font-extrabold text-[#1E293B]">{formatFcfa(plan.priceFcfa)}</p>
              <p className="mt-1 font-semibold text-[#6D28D9]">
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

      <section className="rounded-[1.8rem] bg-[#1E293B] px-8 py-12 text-center text-white md:px-12">
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
