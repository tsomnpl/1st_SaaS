import Link from "next/link";
import { OfferCountdown } from "@/components/pricing/offer-countdown";
import { formatFcfa, paidPlans, type PlanSeed } from "@/lib/plans";
import { localizedAvailability, localizePlan } from "@/lib/plan-copy";
import { getDictionary } from "@/lib/locale";

export async function PricingGrid({
  plans,
  ctaHref,
}: {
  plans?: PlanSeed[];
  ctaHref?: (code: string) => string;
}) {
  const { locale, t } = await getDictionary();
  const items = (plans ?? paidPlans())
    .filter((plan) => plan.priceFcfa > 0)
    .map((plan) => {
      const localized = localizePlan(plan, locale);
      if (!plan.offerDays) return localized;
      return {
        ...localized,
        features: localized.features.map((feature) =>
          feature.startsWith("Offre retirée") || feature.startsWith("Removed 30")
            ? locale === "en"
              ? `Online for ${plan.offerDays} days, then it stops`
              : `Offre en ligne ${plan.offerDays} jours, puis elle s’arrête`
            : feature,
        ),
      };
    });

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((plan) => {
        const highlighted = Boolean(plan.highlighted);
        return (
          <article
            key={plan.code}
            className={`flex flex-col rounded-lg border bg-white p-6 ${
              highlighted ? "border-[#6D28D9]" : "border-slate-200"
            }`}
          >
            {plan.bestSeller ? (
              <p className="mb-3 inline-flex w-fit rounded-full bg-[#6D28D9] px-3 py-1 text-xs font-semibold text-white">
                {t.pricing.bestSeller}
              </p>
            ) : null}
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-500">{plan.shortName}</p>
            </div>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-[#1E293B]">
              {plan.headline}
            </h2>
            <p className="mt-2 text-sm text-slate-600">{plan.description}</p>
            <p className="mt-5 text-4xl font-extrabold tracking-tight text-[#1E293B]">
              {formatFcfa(plan.priceFcfa)}
            </p>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {plan.mintAmount} Mints = {plan.mintAmount} {t.pricing.posters}
            </p>
            <p className="text-sm text-slate-500">{localizedAvailability(plan, locale)}</p>
            {plan.offerEndsAt ? (
              <OfferCountdown endsAt={plan.offerEndsAt} prefix={t.pricing.endsIn} doneLabel={t.pricing.offerDone} />
            ) : null}
            <ul className="mt-5 flex-1 space-y-2.5 text-sm text-slate-700">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <svg viewBox="0 0 16 16" className="mt-0.5 h-4 w-4 shrink-0 text-[#6D28D9]" aria-hidden="true">
                    <path d="M3 8.5 6.2 12 13 4" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Link
              href={ctaHref ? ctaHref(plan.code) : `/checkout?plan=${plan.code}`}
              className={`mt-6 ${highlighted ? "btn-primary" : "btn-secondary"}`}
            >
              {t.pricing.buy}, {formatFcfa(plan.priceFcfa)}
            </Link>
            <p className="mt-3 text-center text-[11px] text-slate-400">{t.pricing.equals}</p>
          </article>
        );
      })}
    </div>
  );
}
