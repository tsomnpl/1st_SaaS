import type { Metadata } from "next";
import Link from "next/link";
import { DOMAIN_LABELS, DOMAINS } from "@/lib/domains";
import { formatFcfa } from "@/lib/plans";
import { loadSellablePlans } from "@/server/plans";
import { localizedAvailability, localizePlan } from "@/lib/plan-copy";
import { getDictionary } from "@/lib/locale";
import { VisualPoster } from "@/components/landing/visual-poster";
import { HeroPosterLoop } from "@/components/landing/hero-poster-loop";
import posters from "@/lib/exact-domain-posters.json";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return {
    title: t.nav.discover,
    description: t.discover.howLead,
  };
}

export default async function DiscoverPage() {
  const { locale, t } = await getDictionary();
  const sellablePlans = await loadSellablePlans();
  const heroPosters = posters.map((poster) => ({
    id: poster.id,
    title: poster.label,
    subtitle: poster.domaine,
    imageSrc: poster.src,
  }));

  return (
    <div className="space-y-24 pb-16">
      <section className="relative overflow-hidden rounded-lg border border-[#e2e8f0] bg-white px-4 py-12 md:px-12 md:py-16">
        <div className="relative grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="inline-flex rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#6D28D9]">
              {t.discover.kicker}
            </p>
            <h1 className="display-title mt-6 max-w-xl text-[#1E293B]">
              {t.cover.title}
            </h1>
            <p className="body-copy mt-6 max-w-lg text-slate-600">{t.cover.lead}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/create" className="btn-primary px-6 py-3">
                {t.nav.create}
              </Link>
              <Link href="/creations" className="btn-secondary px-6 py-3">
                {t.nav.seeCreations}
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="rounded-lg border border-slate-200 bg-white px-3 py-1">{t.cover.factMint}</span>
              <span className="rounded-lg border border-slate-200 bg-white px-3 py-1">{t.cover.factGift}</span>
              <span className="rounded-lg border border-slate-200 bg-white px-3 py-1">{t.cover.factExport}</span>
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

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6D28D9]">{t.discover.beforeAfter}</p>
          <h2 className="section-title mt-3">{t.discover.beforeTitle}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-[#e2e8f0] bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{t.discover.before}</p>
              <p className="mt-3 font-mono text-sm leading-relaxed text-slate-500">{t.discover.beforeText}</p>
            </div>
            <VisualPoster
              title="BURGERS"
              subtitle="Sur place ou à emporter"
              meta="Avenue des Manguiers"
              imageSrc="/creations/promo-burger.webp"
              className="min-h-[220px]"
            />
          </div>
        </article>
        <article className="card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#10B981]">{t.discover.quiz}</p>
          <h2 className="section-title mt-3">{t.discover.quizTitle}</h2>
          <div className="mt-6 space-y-3">
            {t.discover.questions.map((question, index) => (
              <div
                key={question}
                className="flex items-center gap-3 rounded-lg border border-[#e2e8f0] bg-white px-4 py-3 text-sm leading-normal text-slate-700"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-[#6D28D9]">
                  {index + 1}
                </span>
                {question}
              </div>
            ))}
          </div>
        </article>
      </section>

      <section id="creations" className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6D28D9]">{t.discover.showcase}</p>
            <h2 className="section-title mt-3">{t.discover.showcaseTitle}</h2>
          </div>
          <Link href="/creations" className="text-sm font-semibold text-[#6D28D9] hover:underline">
            {t.nav.gallery}
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {posters.map((poster) => (
            <VisualPoster key={poster.id} title={poster.label} subtitle={poster.domaine} imageSrc={poster.src} />
          ))}
        </div>
        <p className="text-sm text-slate-500">{t.discover.showcaseNote}</p>
      </section>

      <section id="comment-ca-marche">
        <h2 className="section-title">{t.discover.howTitle}</h2>
        <p className="body-copy mt-4 max-w-2xl text-slate-600">{t.discover.howLead}</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {t.discover.steps.map((item) => (
            <article key={item.n} className="card p-5">
              <p className="text-xs font-bold text-[#6D28D9]">{item.n}</p>
              <h3 className="mt-2 text-xl font-bold leading-tight">{item.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="section-title">{t.discover.domainsTitle}</h2>
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
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6D28D9]">{t.nav.pricing}</p>
            <h2 className="section-title mt-3">{t.discover.priceTitle}</h2>
            <p className="mt-2 text-slate-600">{t.discover.priceLead}</p>
          </div>
          <Link href="/pricing" className="btn-primary">
            {t.nav.chooseOffer}
          </Link>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sellablePlans.map((seed) => {
            const plan = localizePlan(seed, locale);
            return (
            <Link
              key={plan.code}
              href={`/checkout?plan=${plan.code}`}
              className={`rounded-lg border p-5 ${
                plan.highlighted ? "border-[#1E293B] bg-white" : "border-[#e2e8f0] bg-white"
              }`}
            >
              <p className="text-2xl font-extrabold text-[#1E293B]">{formatFcfa(plan.priceFcfa)}</p>
              <p className="mt-1 font-semibold text-[#6D28D9]">
                {plan.mintAmount} Mints
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {localizedAvailability(plan, locale)}
                {plan.editableExport ? ` · ${t.pricing.editable}` : ""}
              </p>
            </Link>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg bg-[#1E293B] px-8 py-16 text-center text-white md:px-12">
        <h2 className="section-title text-white">{t.discover.ready}</h2>
        <p className="mx-auto mt-3 max-w-xl text-white/70">{t.discover.readyLead}</p>
        <Link href="/create" className="btn-mint mt-6">
          {t.nav.create}
        </Link>
      </section>
    </div>
  );
}
