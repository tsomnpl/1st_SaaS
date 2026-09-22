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

type Result = {
  generationId: string;
  outputUrl?: string | null;
  repaired?: boolean;
};

const STEPS = ["Besoin", "Contenu", "Style", "Récap"] as const;

export function CreateFlyerForm({
  mintBalance,
  canExport = false,
  brandColors = [],
  brandLogoUrl = "",
  regenerateFromId = "",
  initialFormat = "",
  initialDomain,
  initialTitle = "",
}: {
  mintBalance: number;
  canExport?: boolean;
  brandColors?: string[];
  brandLogoUrl?: string;
  regenerateFromId?: string;
  initialFormat?: string;
  initialDomain?: (typeof DOMAINS)[number];
  initialTitle?: string;
}) {
  const [step, setStep] = useState(0);
  const [domain, setDomain] = useState<(typeof DOMAINS)[number]>(initialDomain ?? "Evenementiel");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [confirmMint, setConfirmMint] = useState(false);
  const [rememberBrand, setRememberBrand] = useState(true);
  const [mainImage, setMainImage] = useState("");
  const [logoImage, setLogoImage] = useState(brandLogoUrl);

  const adaptiveFields = useMemo(() => ADAPTIVE_FIELDS[domain] ?? [], [domain]);
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
      creativeFreedom: String(form.get("creativeFreedom") ?? "liberte_guidee"),
      colors: String(form.get("colors") ?? "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
      mainImageUrl: mainImage || undefined,
      logoUrl: logoImage || undefined,
      rememberBrand,
      regenerateFromId: regenerateFromId || undefined,
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
        {STEPS.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(index)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              index === step ? "bg-violet text-white" : "bg-slate-100 text-slate-500"
            }`}
          >
            {index + 1}. {label}
          </button>
        ))}
      </div>

      <div className="card p-5">
        <p className="text-sm font-medium text-violet">Cette création utilisera 1 Mint.</p>
        <h2 className="mt-1 text-xl font-bold">Questionnaire intelligent</h2>
        <p className="mt-1 text-sm text-slate-500">Pas de prompt à écrire. Réponds simplement.</p>
      </div>

      <div className={step === 0 ? "grid gap-4 md:grid-cols-2" : "hidden"}>
        <Select
          name="visualType"
          label="Type d’affiche"
          options={VISUAL_TYPES.map((item) => ({ value: item, label: item }))}
        />
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Domaine</span>
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
        <Input name="objective" label="Objectif" placeholder="Attirer du monde samedi" required />
        <Input name="targetAudience" label="Cible" placeholder="Jeunes actifs, familles…" required />
      </div>

      <div className={step === 1 ? "grid gap-4 md:grid-cols-2" : "hidden"}>
        <Input name="title" label="Titre" placeholder="Formation intensive" required defaultValue={initialTitle} />
        <Input name="subtitle" label="Sous-titre" placeholder="Places limitées" />
        <Input name="description" label="Texte / offre" placeholder="Ce que les gens doivent retenir" />
        <Input name="price" label="Prix" placeholder="25 000 FCFA" />
        <Input name="oldPrice" label="Ancien prix" placeholder="optionnel" />
        <Input name="date" label="Date" placeholder="15 octobre" />
        <Input name="time" label="Heure" placeholder="19h" />
        <Input name="location" label="Lieu" placeholder="Abidjan" />
        <Input name="contactPhone" label="Téléphone" placeholder="+225…" />
        <Input name="whatsapp" label="WhatsApp" placeholder="+225…" />
        <Input name="cta" label="Appel à l’action" placeholder="Inscris-toi maintenant" />
        {adaptiveFields.map((field) => (
          <Input key={field.key} name={`adaptive_${field.key}`} label={field.label} />
        ))}
      </div>

      <div className={step === 2 ? "grid gap-4 md:grid-cols-2" : "hidden"}>
        <Input name="style" label="Style" placeholder="Premium moderne" />
        <Input name="mood" label="Ambiance" placeholder="Énergique, chic, chaleureux…" />
        <Input
          name="colors"
          label="Couleurs (séparées par des virgules)"
          placeholder="#1E293B, #6D28D9"
          defaultValue={brandColors.join(", ")}
        />
        <Select
          name="format"
          label="Format"
          options={FORMATS.map((item) => item)}
          defaultValue={initialFormat || undefined}
        />
        <Select
          name="creativeFreedom"
          label="Liberté créative"
          options={[
            { value: "liberte_guidee", label: "Guidée (recommandé)" },
            { value: "liberte_totale", label: "Totale" },
            { value: "design_tres_precis", label: "Très précise" },
          ]}
        />
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Photo / produit (optionnel)</span>
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
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Logo (optionnel — mémorisé si tu coches le kit de marque)</span>
          {logoImage ? <p className="text-xs text-mint">Logo prêt. Tu peux le remplacer.</p> : null}
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
        <div className="card p-5 text-sm text-slate-600">
          <p>
            FlyerMint va composer la direction artistique puis générer l’affiche. Cela consomme{" "}
            <strong>1 Mint</strong>.
          </p>
          {mainImage ? <p className="mt-2">Ta photo sera conservée comme sujet principal.</p> : null}
          {logoImage ? <p className="mt-2">Ton logo sera réappliqué sur l’affiche.</p> : null}
          {regenerateFromId ? (
            <p className="mt-2">Même direction artistique, nouveau format — 1 Mint.</p>
          ) : null}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={rememberBrand} onChange={(event) => setRememberBrand(event.target.checked)} />
          Mémoriser mon logo et mes couleurs pour les prochaines affiches.
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={confirmMint} onChange={(event) => setConfirmMint(event.target.checked)} />
          Je confirme utiliser 1 Mint pour cette génération.
        </label>
      </div>

      {mintBalance <= 0 ? (
        <p className="text-sm text-amber-700">
          Solde insuffisant.{" "}
          <Link href="/pricing" className="font-semibold text-violet underline">
            Acheter des Mints
          </Link>
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {step > 0 ? (
          <button type="button" className="btn-secondary" onClick={() => setStep((value) => value - 1)}>
            Retour
          </button>
        ) : null}
        {step < 3 ? (
          <button type="submit" className="btn-primary">
            Continuer
          </button>
        ) : (
          <button type="submit" disabled={loading || !canGenerate} className="btn-primary">
            {loading ? "Génération en cours…" : "Générer mon affiche — 1 Mint"}
          </button>
        )}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {result ? (
        <div className="card space-y-3 p-5">
          <p className="font-semibold text-mint">Ton affiche est prête.</p>
          {result.repaired ? (
            <p className="text-sm text-slate-600">La première version a été corrigée (personne / texte / composition).</p>
          ) : null}
          {result.outputUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={result.outputUrl} alt="Affiche générée" className="w-full rounded-xl border border-slate-200" />
              <div className="flex flex-wrap gap-3">
                <a href={result.outputUrl} download className="btn-primary">
                  Télécharger
                </a>
                {canExport ? (
                  <a href={`/api/generations/${result.generationId}/export`} className="btn-secondary">
                    Pack éditable
                  </a>
                ) : null}
                <Link href="/history" className="btn-secondary">
                  Voir l’historique
                </Link>
              </div>
              <p className="text-xs text-slate-500">Même concept, autre format — 1 Mint chacun :</p>
              <div className="flex flex-wrap gap-2">
                {FORMATS.map((item) => (
                  <Link
                    key={item.value}
                    href={`/create?from=${result.generationId}&format=${item.value}`}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-violet-300"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-600">La génération est enregistrée, mais l’image n’est pas encore disponible.</p>
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
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none ring-violet focus:ring-2"
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
