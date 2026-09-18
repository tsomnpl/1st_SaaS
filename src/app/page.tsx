import Link from "next/link";
import { STEPS } from "@/lib/brand";
import { DOMAIN_LABELS, DOMAINS } from "@/lib/domains";
import { formatFcfa, paidPlans } from "@/lib/plans";
import { VisualPoster } from "@/components/landing/visual-poster";

const SHOWCASE = [
  { title: "NIGHT WAVE", subtitle: "Concert live", meta: "Sam. 21h · Plateau", tone: "night" as const, cta: "Prends ta place" },
  { title: "MENU DU SOIR", subtitle: "Burger + boisson", meta: "5 000 FCFA", tone: "warm" as const, cta: "Commander" },
  { title: "NOUVELLE COLLECTION", subtitle: "Lookbook été", meta: "Édition limitée", tone: "gold" as const, cta: "Découvrir" },
  { title: "VILLA VUE MER", subtitle: "Cocody", meta: "Visite ce week-end", tone: "clean" as const, cta: "Prendre RDV" },
  { title: "GLOW STUDIO", subtitle: "Soins visage", meta: "-30% cette semaine", tone: "soft" as const, cta: "Réserver" },
  { title: "OPEN DAY", subtitle: "Formation pro", meta: "Places limitées", tone: "fresh" as const, cta: "S’inscrire" },
  { title: "FLASH SALE", subtitle: "Boutique en ligne", meta: "24h seulement", tone: "sport" as const, cta: "Acheter" },
  { title: "YES I DO", subtitle: "Save the date", meta: "12 décembre", tone: "rose" as const, cta: "RSVP" },
];

const DOMAIN_TONES = [
  "night", "warm", "gold", "soft", "clean", "dark", "fresh", "clean", "sport", "dark",
  "fresh", "gold", "sport", "rose", "warm", "clean", "earth", "dark", "night", "fresh",
  "gold", "clean",
] as const;

export default function Home() {
  return (
    <div className="space-y-24 pb-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white px-5 py-10 shadow-[0_30px_80px_rgba(15,23,42,0.08)] md:px-10 md:py-14">
        <div className="pointer-events-none absolute -left-16 top-0 h-56 w-56 rounded-full bg-[#6D28D9]/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-[#10B981]/10 blur-3xl" />

        <div className="relative grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="inline-flex rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#6D28D9]">
              Direction artistique incluse
            </p>
            <h1 className="mt-5 max-w-xl text-4xl font-extrabold leading-[1.05] tracking-tight text-[#1E293B] md:text-6xl">
              Ton idée. Une affiche qui se remarque.
            </h1>
            <p className="mt-4 text-lg font-medium text-[#6D28D9]">
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

          <div className="relative mx-auto h-[440px] w-full max-w-[440px]">
            <VisualPoster
              title="FESTIVAL LIVE"
              subtitle="Une nuit, une scène"
              meta="Samedi 21h · Zone 4"
              cta="Prends ta place"
              tone="night"
              className="absolute left-8 top-0 z-20 w-[58%] rotate-[-7deg] animate-float"
            />
            <VisualPoster
              title="BEAUTY WEEK"
              subtitle="-30% soins"
              meta="Cette semaine seulement"
              cta="Réserver"
              tone="soft"
              className="absolute right-0 top-10 z-10 w-[46%] rotate-[9deg] animate-float-delayed"
            />
            <VisualPoster
              title="OPEN CLASS"
              subtitle="Places limitées"
              meta="Formation intensive"
              cta="S’inscrire"
              tone="fresh"
              className="absolute bottom-2 left-0 z-30 w-[44%] rotate-[-4deg]"
            />
            <div className="glass absolute bottom-8 right-2 z-40 rounded-2xl px-3 py-2 text-xs text-slate-600">
              Direction artistique
              <p className="text-sm font-semibold text-[#6D28D9]">Hiérarchie · CTA · Safe zone</p>
            </div>
            <div className="glass absolute right-4 top-2 z-40 rounded-2xl px-3 py-2 text-xs text-slate-600">
              Mints
              <p className="text-lg font-bold text-[#10B981]">1 affiche offerte</p>
            </div>
          </div>
        </div>
      </section>

      <section id="creations" className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6D28D9]">Showcase</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Des affiches, pas des cartes vides.</h2>
          </div>
          <Link href="/creations" className="text-sm font-semibold text-[#6D28D9] hover:underline">
            Toute la galerie
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {SHOWCASE.map((poster) => (
            <VisualPoster key={poster.title} {...poster} />
          ))}
        </div>
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
            <VisualPoster
              title="MENU DU SOIR"
              subtitle="Burger + boisson"
              meta="5 000 FCFA"
              cta="Appeler"
              tone="warm"
              className="min-h-[220px]"
            />
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
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-50 text-xs font-bold text-[#6D28D9]">
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
          {DOMAINS.map((domain, index) => (
            <VisualPoster
              key={domain}
              title={DOMAIN_LABELS[domain]}
              subtitle="Affiche pro"
              cta="Créer"
              tone={DOMAIN_TONES[index] ?? "clean"}
              className="min-h-[180px]"
            />
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
