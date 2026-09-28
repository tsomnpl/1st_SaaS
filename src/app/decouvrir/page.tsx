import type { Metadata } from "next";
import Link from "next/link";
import { STEPS } from "@/lib/brand";
import { DOMAIN_LABELS, DOMAINS } from "@/lib/domains";
import { formatFcfa, paidPlans } from "@/lib/plans";
import { VisualPoster } from "@/components/landing/visual-poster";
import { HeroPosterLoop } from "@/components/landing/hero-poster-loop";
import posters from "@/lib/exact-domain-posters.json";

export const metadata: Metadata = {
  title: "Découvrir",
  description: "Le parcours FlyerMint : questions, direction artistique, affiche à télécharger.",
};

export default function DiscoverPage() {
  const heroPosters = posters.map((poster) => ({
    id: poster.id,
    title: poster.label,
    subtitle: poster.domaine,
    imageSrc: poster.src,
  }));

  return (
    <div className="space-y-24 pb-8">
      <section className="relative overflow-hidden rounded-lg border border-slate-200 bg-white px-5 py-10 md:px-10 md:py-14">
        <div className="relative grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="inline-flex rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#6D28D9]">
              Direction artistique incluse
            </p>
            <h1 className="mt-5 max-w-xl text-4xl font-extrabold leading-[1.05] tracking-tight text-[#1E293B] md:text-6xl">
              Décris ton événement ou ton offre. Reçois une affiche prête à publier.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-600 md:text-lg">
              Tu réponds à quelques questions, FlyerMint compose l’affiche, tu la télécharges.
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
              <span className="rounded-lg border border-slate-200 bg-white px-3 py-1">1 Mint = 1 affiche</span>
              <span className="rounded-lg border border-slate-200 bg-white px-3 py-1">1 Mint offert à l’inscription</span>
              <span className="rounded-lg border border-slate-200 bg-white px-3 py-1">L’export ne consomme aucun Mint</span>
            </div>
          </div>

          {heroPosters.length ? (
            <HeroPosterLoop posters={heroPosters} />
          ) : (
            <VisualPoster
              title="Concert"
              subtitle="Exemple"
              imageSrc="/creations/evenementiel-03.webp"
            />
          )}
        </div>
      </section>

      <section id="creations" className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6D28D9]">Showcase</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Une affiche exacte par domaine.</h2>
          </div>
          <Link href="/creations" className="text-sm font-semibold text-[#6D28D9] hover:underline">
            Toute la galerie
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {posters.map((poster) => (
            <VisualPoster key={poster.id} title={poster.label} subtitle={poster.domaine} imageSrc={poster.src} />
          ))}
        </div>
        <p className="text-sm text-slate-500">Chaque visuel reprend la référence de son dossier, sans nom, numéro ni date réelle.</p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6D28D9]">Avant / Après</p>
          <h3 className="mt-2 text-2xl font-extrabold">D’un message brut à un visuel qui vend</h3>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Avant</p>
              <p className="mt-3 font-mono text-sm leading-relaxed text-slate-500">
                Fast food, burgers, pizzas, paninis, sur place ou à emporter, appelle ce numero.
              </p>
            </div>
            <VisualPoster
              title="BURGERS"
              subtitle="Sur place ou à emporter"
              meta="Avenue des Manguiers"
              imageSrc="/creations/promo-burger.webp"
              className="min-h-[220px]"
            />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {posters.slice(0, 4).map((poster) => (
              <VisualPoster key={poster.id} title={poster.label} subtitle={poster.domaine} imageSrc={poster.src} />
            ))}
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
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-[#6D28D9]">
                  {index + 1}
                </span>
                {question}
              </div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {posters.slice(4, 8).map((poster) => (
              <VisualPoster key={poster.id} title={poster.label} subtitle={poster.domaine} imageSrc={poster.src} />
            ))}
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
              <p className="text-xs font-bold text-[#6D28D9]">{item.n}</p>
              <h3 className="mt-2 text-lg font-bold">{item.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-3xl font-extrabold tracking-tight">Tous les univers, un même niveau d’exigence</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {DOMAINS.map((domain) => (
            <article key={domain} className="rounded-lg border border-slate-200 bg-white px-3 py-4 text-sm font-semibold text-[#1E293B]">
              {DOMAIN_LABELS[domain]}
            </article>
          ))}
        </div>
      </section>

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
              className={`rounded-lg border p-5 ${
                plan.highlighted ? "border-[#6D28D9] bg-white" : "border-slate-200 bg-slate-50"
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
