"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
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
  qcStatus?: "passed" | "failed" | "unverified";
  visualReference?: { attached?: boolean; inputs?: string[] };
};

const STEPS = ["Besoin", "Contenu", "Style", "Récap"] as const;

export function CreateFlyerForm({
  mintBalance,
  canExport = false,
  brandColors = [],
  brandLogoUrl = "",
  regenerateFromId = "",
  initialFormat = "",
  initialDomain = "",
}: {
  mintBalance: number;
  canExport?: boolean;
  brandColors?: string[];
  brandLogoUrl?: string;
  regenerateFromId?: string;
  initialFormat?: string;
  initialDomain?: string;
}) {
  const [step, setStep] = useState(0);
  const [domain, setDomain] = useState<(typeof DOMAINS)[number]>(
    DOMAINS.includes(initialDomain as (typeof DOMAINS)[number])
      ? (initialDomain as (typeof DOMAINS)[number])
      : "Evenementiel",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [confirmMint, setConfirmMint] = useState(false);
  const [rememberBrand, setRememberBrand] = useState(true);
  const [mainImage, setMainImage] = useState("");
  const [logoImage, setLogoImage] = useState(brandLogoUrl);

  const pendingInvalid = useRef<string | null>(null);
  const stepRefs = useRef<Array<HTMLDivElement | null>>([]);

  const adaptiveFields = useMemo(() => ADAPTIVE_FIELDS[domain] ?? [], [domain]);
  const canGenerate = mintBalance > 0 && confirmMint;

  // Hidden steps stay mounted so answers survive "Retour"; the browser cannot focus
  // an invalid field inside a hidden step, so we switch step first and report after render.
  function reportField(index: number, name: string) {
    const field = stepRefs.current[index]?.querySelector<HTMLInputElement>(`[name="${name}"]`);
    field?.reportValidity();
    field?.focus();
  }

  useEffect(() => {
    const name = pendingInvalid.current;
    if (!name) return;
    pendingInvalid.current = null;
    reportField(step, name);
  }, [step]);

  function firstInvalidStep(upTo: number) {
    for (let index = 0; index <= upTo; index += 1) {
      const fields = stepRefs.current[index]?.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input[name], select[name]");
      const invalid = [...(fields ?? [])].find((field) => !field.checkValidity());
      if (invalid) return { index, name: invalid.name };
    }
    return null;
  }

  function goToStep(target: number) {
    if (target <= step) {
      setStep(target);
      return true;
    }
    const invalid = firstInvalidStep(target - 1);
    if (invalid) {
      if (invalid.index === step) {
        reportField(step, invalid.name);
      } else {
        pendingInvalid.current = invalid.name;
        setStep(invalid.index);
      }
      return false;
    }
    setStep(target);
    return true;
  }

  // Photo + logo + brief must stay under the 4.5 MB serverless body limit, so images are
  // downscaled in the browser before upload (logos keep PNG transparency).
  async function readImage(file: File | undefined, kind: "photo" | "logo" = "photo") {
    if (!file) return "";
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) throw new Error("INVALID_IMAGE");
    if (file.size > 8_000_000) throw new Error("INVALID_IMAGE");
    const source = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("INVALID_IMAGE"));
      reader.readAsDataURL(file);
    });
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("INVALID_IMAGE"));
      element.src = source;
    });
    const maxSide = kind === "logo" ? 800 : 1600;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
    const dataUrl = kind === "logo" ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", 0.9);
    if (dataUrl.length > 2_600_000) throw new Error("INVALID_IMAGE");
    return dataUrl;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < 3) {
      goToStep(step + 1);
      return;
    }
    if (!goToStep(3)) return;
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
      const data = (await response.json()) as {
        ok: boolean;
        error?: string;
        message?: string;
      } & Result;
      if (!data.ok) {
        setError(data.message || publicErrorMessage(new Error(data.error ?? "GENERATION_FAILED")));
        return;
      }
      setResult(data);
    } catch (e) {
      setError(publicErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {STEPS.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => goToStep(index)}
            aria-current={index === step ? "step" : undefined}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              index === step ? "bg-[#6D28D9] text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            {index + 1}. {label}
          </button>
        ))}
      </div>

      <div className="card p-5">
        <p className="text-sm font-medium text-[#10B981]">Cette création utilisera 1 Mint.</p>
        <h2 className="mt-1 text-xl font-bold">Questionnaire intelligent</h2>
        <p className="mt-1 text-sm text-slate-500">Pas de prompt à écrire. Réponds simplement.</p>
      </div>

      <div ref={(node) => { stepRefs.current[0] = node; }} className={step === 0 ? "grid gap-4 md:grid-cols-2" : "hidden"}>
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

      <div ref={(node) => { stepRefs.current[1] = node; }} className={step === 1 ? "grid gap-4 md:grid-cols-2" : "hidden"}>
        <Input name="title" label="Titre" placeholder="Formation intensive" required />
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

      <div ref={(node) => { stepRefs.current[2] = node; }} className={step === 2 ? "grid gap-4 md:grid-cols-2" : "hidden"}>
        <Input name="style" label="Style" placeholder="Premium moderne" />
        <Input name="mood" label="Ambiance" placeholder="Énergique, chic, chaleureux…" />
        <Input
          name="colors"
          label="Couleurs (séparées par des virgules)"
          placeholder="#111827, #20C997"
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
        <ImageUpload
          name="mainImageFile"
          label="Photo / produit (optionnel)"
          hint="La personne ou le produit à mettre sur l’affiche. PNG, JPG ou WebP, 8 Mo max."
          buttonLabel="Ajouter une photo"
          value={mainImage}
          onChange={setMainImage}
          readImage={(file) => readImage(file, "photo")}
          onError={(e) => setError(publicErrorMessage(e))}
        />
        <ImageUpload
          name="logoFile"
          label="Logo (optionnel)"
          hint="Placé à l’emplacement du logo. Mémorisé si tu coches le kit de marque."
          buttonLabel="Ajouter un logo"
          value={logoImage}
          onChange={setLogoImage}
          readImage={(file) => readImage(file, "logo")}
          onError={(e) => setError(publicErrorMessage(e))}
        />
      </div>

      <div ref={(node) => { stepRefs.current[3] = node; }} className={step === 3 ? "space-y-4" : "hidden"}>
        <div className="card p-5 text-sm text-slate-600">
          <p>
            FlyerMint va composer la direction artistique puis générer l’affiche. Cela consomme{" "}
            <strong>1 Mint</strong>.
          </p>
          {mainImage || logoImage ? (
            <div className="mt-3 flex flex-wrap gap-4">
              {mainImage ? (
                <figure className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mainImage} alt="Ta photo" className="h-14 w-14 rounded-lg border border-slate-200 object-cover" />
                  <figcaption>Ta photo sera le sujet principal.</figcaption>
                </figure>
              ) : null}
              {logoImage ? (
                <figure className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoImage} alt="Ton logo" className="h-14 w-14 rounded-lg border border-slate-200 bg-white object-contain" />
                  <figcaption>Ton logo sera placé sur l’affiche.</figcaption>
                </figure>
              ) : null}
            </div>
          ) : null}
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
        {!confirmMint && mintBalance > 0 ? (
          <p className="text-xs text-amber-700">Coche la confirmation pour activer le bouton de génération.</p>
        ) : null}
      </div>

      {mintBalance <= 0 ? (
        <p className="text-sm text-amber-700">
          Solde insuffisant.{" "}
          <Link href="/pricing" className="font-semibold text-[#20C997] underline">
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
          <button type="button" className="btn-primary" onClick={() => goToStep(step + 1)}>
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
          <p className="font-semibold text-[#20C997]">Ton affiche est prête.</p>
          {result.repaired ? (
            <p className="text-sm text-slate-600">La première version a été corrigée (personne / texte / composition).</p>
          ) : null}
          {result.qcStatus === "unverified" ? (
            <p className="text-sm text-amber-700">
              Le contrôle qualité n’a pas pu relire l’affiche. Vérifie l’orthographe avant de publier.
            </p>
          ) : null}
          {result.visualReference?.inputs?.length ? (
            <p className="text-xs text-slate-500">
              Images transmises au modèle :{" "}
              {result.visualReference.inputs
                .map((input) => ({ reference: "affiche de référence", photo: "ta photo", logo: "ton logo" })[input] ?? input)
                .join(", ")}
              .
            </p>
          ) : null}
          {result.outputUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.outputUrl}
                alt="Affiche générée à partir de ton brief"
                className="w-full rounded-xl border border-slate-200"
              />
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

function ImageUpload({
  name,
  label,
  hint,
  buttonLabel,
  value,
  onChange,
  readImage,
  onError,
}: {
  name: string;
  label: string;
  hint: string;
  buttonLabel: string;
  value: string;
  onChange: (value: string) => void;
  readImage: (file: File | undefined) => Promise<string>;
  onError: (error: unknown) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");

  return (
    <div className="space-y-1 text-sm md:col-span-2">
      <span className="font-medium text-slate-700">{label}</span>
      <div className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-[#6D28D9]/30 bg-[#6D28D9]/5 p-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={`Aperçu ${label}`} className="h-16 w-16 shrink-0 rounded-xl border border-slate-200 bg-white object-contain" />
        ) : (
          <span aria-hidden className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white text-2xl text-[#6D28D9]">
            +
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-800">
            {value ? fileName || "Image prête" : "Aucune image"}
          </p>
          <p className="text-xs text-slate-500">{hint}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className="btn-primary px-3 py-1.5 text-xs" onClick={() => inputRef.current?.click()}>
              {value ? "Remplacer" : buttonLabel}
            </button>
            {value ? (
              <button
                type="button"
                className="btn-secondary px-3 py-1.5 text-xs"
                onClick={() => {
                  onChange("");
                  setFileName("");
                  if (inputRef.current) inputRef.current.value = "";
                }}
              >
                Retirer
              </button>
            ) : null}
          </div>
        </div>
      </div>
      <input
        ref={inputRef}
        name={name}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          try {
            onChange(await readImage(file));
            setFileName(file?.name ?? "");
          } catch (e) {
            event.target.value = "";
            onError(e);
          }
        }}
      />
    </div>
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
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none ring-[#20C997] focus:ring-2"
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
