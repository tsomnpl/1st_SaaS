"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import {
  ADAPTIVE_FIELDS,
  DOMAINS,
  DOMAIN_LABELS,
  FORMATS,
  VISUAL_TYPES,
} from "@/lib/domains";
import { publicErrorMessage } from "@/lib/errors";
import { campaignMatchesDomain, campaignMatchesMarket } from "@/lib/seasonal";
import { useCopy } from "@/components/chrome/locale-provider";

type SeasonalOffer = {
  slug: string;
  name: string;
  markets: string[];
  domains: string[];
};

type VariantView = {
  id: string;
  variant: "A" | "B" | null;
  outputUrl: string | null;
  rodiCost: number | null;
};

type Result = {
  generationId: string;
  outputUrl?: string | null;
  repaired?: boolean;
  selectedVariantId?: string;
  variants?: VariantView[];
  countdown?: { label: string; type: string } | null;
};

export function CreateFlyerForm({
  mintBalance,
  canExport = false,
  canUsePersonalReference = false,
  brandColors = [],
  brandLogoUrl = "",
  regenerateFromId = "",
  initialFormat = "",
  canUseTwoVariants = false,
  seasonalOffers = [],
}: {
  mintBalance: number;
  canExport?: boolean;
  canUsePersonalReference?: boolean;
  brandColors?: string[];
  brandLogoUrl?: string;
  regenerateFromId?: string;
  initialFormat?: string;
  canUseTwoVariants?: boolean;
  seasonalOffers?: SeasonalOffer[];
}) {
  const t = useCopy();
  const steps = t.form.steps;
  const [step, setStep] = useState(0);
  const [domain, setDomain] = useState<(typeof DOMAINS)[number]>("Evenementiel");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [confirmMint, setConfirmMint] = useState(false);
  const [rememberBrand, setRememberBrand] = useState(true);
  const [mainImage, setMainImage] = useState("");
  const [logoImage, setLogoImage] = useState(brandLogoUrl);
  const [personalPoster, setPersonalPoster] = useState("");
  const [market, setMarket] = useState<"" | "TG" | "BJ">("");
  const [seasonalChoice, setSeasonalChoice] = useState<"accept" | "decline">("decline");

  const adaptiveFields = useMemo(() => ADAPTIVE_FIELDS[domain] ?? [], [domain]);
  const seasonalOffer = useMemo(
    () =>
      seasonalOffers.find(
        (offer) => campaignMatchesDomain(offer.domains, domain) && campaignMatchesMarket(offer.markets, market || null),
      ) ?? null,
    [seasonalOffers, domain, market],
  );
  const canGenerate = mintBalance > 0 && confirmMint;

  async function readImage(file: File | undefined) {
    if (!file) return "";
    if (!file.type.startsWith("image/")) throw new Error("INVALID_IMAGE");
    if (file.size > 2_000_000) throw new Error("INVALID_IMAGE");
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("INVALID_IMAGE"));
      reader.readAsDataURL(file);
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < 3) {
      setStep((value) => value + 1);
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    const form = new FormData(event.currentTarget);
    const adaptiveData = Object.fromEntries(
      adaptiveFields.map((field) => [field.key, String(form.get(`adaptive_${field.key}`) ?? "")]),
    );

    const payload = {
      visualType: String(form.get("visualType") ?? ""),
      domain,
      objective: String(form.get("objective") ?? ""),
      targetAudience: String(form.get("targetAudience") ?? ""),
      title: String(form.get("title") ?? ""),
      subtitle: String(form.get("subtitle") ?? ""),
      description: String(form.get("description") ?? ""),
      price: String(form.get("price") ?? ""),
      oldPrice: String(form.get("oldPrice") ?? ""),
      date: String(form.get("date") ?? ""),
      time: String(form.get("time") ?? ""),
      location: String(form.get("location") ?? ""),
      contactPhone: String(form.get("contactPhone") ?? ""),
      whatsapp: String(form.get("whatsapp") ?? ""),
      cta: String(form.get("cta") ?? ""),
      style: String(form.get("style") ?? ""),
      mood: String(form.get("mood") ?? ""),
      format: String(form.get("format") ?? "instagram_post"),
      creativeFreedom: "copie_exacte",
      colors: String(form.get("colors") ?? "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
      mainImageUrl: mainImage || undefined,
      logoUrl: logoImage || undefined,
      personalReferenceUrl: canUsePersonalReference && personalPoster ? personalPoster : undefined,
      rememberBrand,
      regenerateFromId: regenerateFromId || undefined,
      market: market || undefined,
      seasonalSlug: seasonalOffer && seasonalChoice === "accept" ? seasonalOffer.slug : undefined,
      seasonalDecline: !(seasonalOffer && seasonalChoice === "accept"),
      adaptiveData,
    };

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { ok: boolean; error?: string } & Result;
      if (!data.ok) throw new Error(data.error ?? "GENERATION_FAILED");
      setResult(data);
    } catch (e) {
      setError(publicErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="flex gap-2">
        {steps.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(index)}
            className={`rounded-lg px-3 py-1 text-xs font-semibold ${
              index === step ? "bg-[#6D28D9] text-white" : "bg-slate-100 text-slate-500"
            }`}
          >
            {index + 1}. {label}
          </button>
        ))}
      </div>

      <div className="card p-5">
        <p className="text-sm font-medium text-[#6D28D9]">{t.form.usesMint}</p>
        <h2 className="mt-1 text-xl font-bold">{t.form.quiz}</h2>
        <p className="mt-1 text-sm text-slate-500">{t.form.quizLead}</p>
      </div>

      <div className={step === 0 ? "grid gap-4 md:grid-cols-2" : "hidden"}>
        <Select
          name="visualType"
          label={t.form.visualType}
          options={VISUAL_TYPES.map((item) => ({ value: item, label: item }))}
        />
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">{t.form.domain}</span>
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value as (typeof DOMAINS)[number])}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
          >
            {DOMAINS.map((item) => (
              <option key={item} value={item}>
                {DOMAIN_LABELS[item]}
              </option>
            ))}
          </select>
        </label>
        <Input name="objective" label={t.form.objective} placeholder="Attirer du monde samedi" required />
        <Input name="targetAudience" label={t.form.audience} placeholder="Jeunes actifs, familles…" required />
      </div>

      <div className={step === 1 ? "grid gap-4 md:grid-cols-2" : "hidden"}>
        <Input name="title" label={t.form.title} placeholder="Formation intensive" required />
        <Input name="subtitle" label={t.form.subtitle} placeholder="Places limitées" />
        <Input name="description" label={t.form.body} placeholder="Ce que les gens doivent retenir" />
        <Input name="price" label={t.form.price} placeholder="25 000 FCFA" />
        <Input name="oldPrice" label={t.form.oldPrice} placeholder="optionnel" />
        <div className="space-y-1">
          <Input name="date" label={t.form.date} placeholder="30 septembre 2026" />
          <p className="text-xs text-slate-500">{t.form.dateHint}</p>
        </div>
        <Input name="time" label={t.form.time} placeholder="19h" />
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">{t.form.market}</span>
          <select
            value={market}
            onChange={(event) => setMarket(event.target.value as "" | "TG" | "BJ")}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
          >
            <option value="">{t.form.marketUnset}</option>
            <option value="TG">{t.form.marketTogo}</option>
            <option value="BJ">{t.form.marketBenin}</option>
          </select>
        </label>
        <Input name="location" label={t.form.place} placeholder="Abidjan" />
        <Input name="contactPhone" label={t.form.phone} placeholder="+225…" />
        <Input name="whatsapp" label={t.form.whatsapp} placeholder="+225…" />
        <Input name="cta" label={t.form.cta} placeholder="Inscris-toi maintenant" />
        {adaptiveFields.map((field) => (
          <Input key={field.key} name={`adaptive_${field.key}`} label={field.label} />
        ))}
      </div>

      <div className={step === 2 ? "grid gap-4 md:grid-cols-2" : "hidden"}>
        <Input name="style" label={t.form.style} placeholder="Premium moderne" />
        <Input name="mood" label={t.form.mood} placeholder="Énergique, chic, chaleureux…" />
        <Input
          name="colors"
          label={t.form.colors}
          placeholder="#1E293B, #6D28D9"
          defaultValue={brandColors.join(", ")}
        />
        <Select
          name="format"
          label={t.form.format}
          options={FORMATS.map((item) => item)}
          defaultValue={initialFormat || undefined}
        />
        <input type="hidden" name="creativeFreedom" value="copie_exacte" />
        <p className="text-xs text-slate-500 md:col-span-2">{t.form.exact}</p>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">{t.form.photo}</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={async (event) => {
              try {
                setMainImage(await readImage(event.target.files?.[0]));
              } catch (e) {
                setError(publicErrorMessage(e));
              }
            }}
          />
        </label>
        {canUsePersonalReference ? (
          <label className="space-y-1 text-sm md:col-span-2">
            <span className="font-medium text-slate-700">{t.form.reference}</span>
            <p className="text-xs text-slate-500">{t.form.referenceHelp}</p>
            {personalPoster ? <p className="text-xs text-[#10B981]">{t.form.referenceReady}</p> : null}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={async (event) => {
                try {
                  setPersonalPoster(await readImage(event.target.files?.[0]));
                } catch (e) {
                  setError(publicErrorMessage(e));
                }
              }}
            />
          </label>
        ) : (
          <p className="text-xs text-slate-500 md:col-span-2">
            {t.form.referenceLocked}
          </p>
        )}
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">{t.form.logo}</span>
          {logoImage ? <p className="text-xs text-[#10B981]">{t.form.logoReady}</p> : null}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={async (event) => {
              try {
                setLogoImage(await readImage(event.target.files?.[0]));
              } catch (e) {
                setError(publicErrorMessage(e));
              }
            }}
          />
        </label>
      </div>

      <div className={step === 3 ? "space-y-4" : "hidden"}>
        {canUseTwoVariants && !regenerateFromId ? <p className="text-sm text-slate-600">{t.form.twoVariants}</p> : null}
        {seasonalOffer ? (
          <div className="card space-y-3 p-5">
            <p className="text-sm font-semibold text-[#6D28D9]">{t.form.seasonalTitle}</p>
            <p className="text-lg font-bold">{seasonalOffer.name}</p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${seasonalChoice === "accept" ? "bg-[#6D28D9] text-white" : "bg-slate-100 text-slate-600"}`}
                onClick={() => setSeasonalChoice("accept")}
              >
                {t.form.seasonalUse}
              </button>
              <button
                type="button"
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${seasonalChoice === "decline" ? "bg-[#1E293B] text-white" : "bg-slate-100 text-slate-600"}`}
                onClick={() => setSeasonalChoice("decline")}
              >
                {t.form.seasonalSkip}
              </button>
            </div>
          </div>
        ) : null}
        <div className="card p-5 text-sm text-slate-600">
          <p>{t.form.recap}</p>
          {personalPoster ? <p className="mt-2">{t.form.recapPoster}</p> : null}
          {mainImage ? <p className="mt-2">{t.form.recapPhoto}</p> : null}
          {logoImage ? <p className="mt-2">{t.form.recapLogo}</p> : null}
          {regenerateFromId ? <p className="mt-2">{t.form.recapFormat}</p> : null}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={rememberBrand} onChange={(event) => setRememberBrand(event.target.checked)} />
          {t.form.remember}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={confirmMint} onChange={(event) => setConfirmMint(event.target.checked)} />
          {t.form.confirm}
        </label>
      </div>

      {mintBalance <= 0 ? (
        <p className="text-sm text-amber-700">
          {t.form.broke}{" "}
          <Link href="/pricing" className="font-semibold text-[#6D28D9] underline">
            {t.nav.buyMints}
          </Link>
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {step > 0 ? (
          <button type="button" className="btn-secondary" onClick={() => setStep((value) => value - 1)}>
            {t.form.back}
          </button>
        ) : null}
        {step < 3 ? (
          <button type="submit" className="btn-primary">
            {t.form.next}
          </button>
        ) : (
          <button type="submit" disabled={loading || !canGenerate} className="btn-primary">
            {loading ? t.form.generating : t.form.generate}
          </button>
        )}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {result ? (
        <div className="card space-y-3 p-5">
          <p className="font-semibold text-[#10B981]">{t.form.ready}</p>
          {result.countdown?.label ? <p className="text-sm text-slate-600">{result.countdown.label}</p> : null}
          {result.repaired ? <p className="text-sm text-slate-600">{t.form.repaired}</p> : null}
          {result.variants && result.variants.length > 1 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {result.variants.map((variant) => {
                const selected = (result.selectedVariantId ?? result.generationId) === variant.id;
                const label = variant.variant === "B" ? t.form.variantB : t.form.variantA;
                return (
                  <article key={variant.id} className="space-y-2">
                    <p className="text-sm font-semibold">{label}</p>
                    {variant.outputUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={variant.outputUrl} alt={label} className="w-full rounded-xl border border-slate-200" />
                    ) : (
                      <p className="text-sm text-amber-700">{t.form.variantMissing}</p>
                    )}
                    {variant.outputUrl ? (
                      <button
                        type="button"
                        className={selected ? "btn-primary" : "btn-secondary"}
                        onClick={async () => {
                          const response = await fetch(`/api/generations/${variant.id}/select`, { method: "POST" });
                          const data = (await response.json()) as { ok: boolean };
                          if (!data.ok) return;
                          setResult((current) =>
                            current
                              ? {
                                  ...current,
                                  generationId: variant.id,
                                  selectedVariantId: variant.id,
                                  outputUrl: variant.outputUrl,
                                }
                              : current,
                          );
                        }}
                      >
                        {selected ? t.form.chosen : t.form.chooseVariant}
                      </button>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : null}
          {result.outputUrl ? (
            <>
              {!(result.variants && result.variants.length > 1) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={result.outputUrl} alt={t.form.posterAlt} className="w-full rounded-xl border border-slate-200" />
              ) : null}
              <div className="flex flex-wrap gap-3">
                <a href={result.outputUrl} download className="btn-primary">
                  {t.form.download}
                </a>
                {canExport ? (
                  <a href={`/api/generations/${result.selectedVariantId ?? result.generationId}/export`} className="btn-secondary">
                    {t.form.editable}
                  </a>
                ) : null}
                <Link href="/history" className="btn-secondary">
                  {t.form.seeHistory}
                </Link>
              </div>
              <p className="text-xs text-slate-500">{t.form.otherFormat}</p>
              <div className="flex flex-wrap gap-2">
                {FORMATS.map((item) => (
                  <Link
                    key={item.value}
                    href={`/create?from=${result.generationId}&format=${item.value}`}
                    className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-400"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-600">{t.form.imagePending}</p>
          )}
        </div>
      ) : null}
    </form>
  );
}

function Input({
  name,
  label,
  placeholder,
  required,
  defaultValue,
}: {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <input
        name={name}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none ring-[#6D28D9] focus:ring-2"
      />
    </label>
  );
}

function Select({
  name,
  label,
  options,
  defaultValue,
}: {
  name: string;
  label: string;
  options: readonly { value: string; label: string }[] | { value: string; label: string }[];
  defaultValue?: string;
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <select name={name} defaultValue={defaultValue} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2">
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
