import Link from "next/link";
import { formatFcfa, paidPlans, type PlanSeed } from "@/lib/plans";

export function PricingGrid({
  plans,
  ctaHref,
}: {
  plans?: PlanSeed[];
  ctaHref?: (code: string) => string;
}) {
  const items = (plans ?? paidPlans()).filter((plan) => plan.priceFcfa > 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((plan) => {
        const highlighted = Boolean(plan.highlighted);
        return (
          <article
            key={plan.code}
            className={`card flex flex-col p-6 ${
              highlighted
                ? "border-violet shadow-[0_20px_50px_rgba(109,40,217,0.12)]"
                : "border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-500">{plan.shortName}</p>
              {highlighted ? (
                <span className="rounded-full bg-violet/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-violet">
                  Le plus choisi
                </span>
              ) : null}
            </div>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-night">
              {plan.headline}
            </h2>
            <p className="mt-2 text-sm text-slate-600">{plan.description}</p>
            <p className="mt-5 text-4xl font-extrabold tracking-tight text-night">
              {formatFcfa(plan.priceFcfa)}
            </p>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {plan.mintAmount} Mints = {plan.mintAmount} affiches
            </p>
            <p className="text-sm text-slate-500">
              {plan.durationDays ? `Valables ${plan.durationDays} jours` : "Sans expiration"}
            </p>
            <ul className="mt-5 flex-1 space-y-2.5 text-sm text-slate-700">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <span className="mt-0.5 text-violet">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Link
              href={ctaHref ? ctaHref(plan.code) : `/checkout?plan=${plan.code}`}
              className={`mt-6 ${highlighted ? "btn-primary" : "btn-secondary"}`}
            >
              Acheter — {formatFcfa(plan.priceFcfa)}
            </Link>
            <p className="mt-3 text-center text-[11px] text-slate-400">1 Mint = 1 affiche</p>
          </article>
        );
      })}
    </div>
  );
}
