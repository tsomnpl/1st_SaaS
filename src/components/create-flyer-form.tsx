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
import {
  CREATION_MODES,
  creationModeById,
  modeRequiresPersonalReference,
  type CreationModeId,
} from "@/lib/creation-modes";
import { CreationModePicker } from "@/components/creation-mode-picker";

type Result = {
  generationId: string;
  outputUrl?: string | null;
  repaired?: boolean;
  personalReferenceDenied?: boolean;
  personalReferenceUsed?: boolean;
};

const STEPS = ["Besoin", "Contenu", "Style", "Récap"] as const;

export function CreateFlyerForm({
  mintBalance,
  canExport = false,
  canUsePersonalReference = false,
  brandColors = [],
  brandLogoUrl = "",
  regenerateFromId = "",
  initialFormat = "",
  initialDomain = "",
  initialMode = "",
  initialStep = 0,
}: {
  mintBalance: number;
  canExport?: boolean;
  canUsePersonalReference?: boolean;
  brandColors?: string[];
  brandLogoUrl?: string;
  regenerateFromId?: string;
  initialFormat?: string;
  initialDomain?: string;
  initialMode?: string;
  initialStep?: number;
}) {
  const startingMode =
    initialMode && CREATION_MODES.some((mode) => mode.id === initialMode)
      ? (initialMode as CreationModeId)
      : regenerateFromId
        ? "idea"
        : null;
  const [mode, setMode] = useState<CreationModeId | null>(startingMode);
  const [step, setStep] = useState(Math.min(3, Math.max(0, initialStep)));
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
  const [personalReference, setPersonalReference] = useState("");
  const [secondaryImage, setSecondaryImage] = useState("");

  const adaptiveFields = useMemo(() => ADAPTIVE_FIELDS[domain] ?? [], [domain]);
  const selectedMode = creationModeById(mode ?? undefined);
  const canGenerate = mintBalance > 0 && confirmMint;
  const personalRefLocked = !canUsePersonalReference;
  const needsPersonalRef = modeRequiresPersonalReference(mode ?? undefined);

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
    if (!mode) return;
    if (step < 3) {
      setStep((value) => value + 1);
      return;
    }
    if (needsPersonalRef && canUsePersonalReference && !personalReference) {
      setError("Ajoutez une affiche de référence pour ce mode, ou choisissez un autre mode.");
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
      creationMode: mode,
      visualType: String(form.get("visualType") ?? ""),
      domain,
      objective: String(form.get("objective") ?? ""),
      targetAudience: String(form.get("targetAudience") ?? ""),
      title: String(form.get("title") ?? ""),
      subtitle: String(form.get("subtitle") ?? ""),
      description: String(form.get("description") ?? ""),
      price: String(form.get("price") ?? ""),
      oldPrice: String(form.get("oldPrice") ?? ""),
      newPrice: String(form.get("newPrice") ?? ""),
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
      personalReferenceUrl: canUsePersonalReference ? personalReference || undefined : undefined,
      secondaryImageUrl: secondaryImage || undefined,
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

  if (!mode) {
    return (
      <CreationModePicker
        canUsePersonalReference={canUsePersonalReference}
        onSelect={(next) => {
          setMode(next);
          setStep(0);
          setError(null);
        }}
      />
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6D28D9]">
            Mode {selectedMode?.number} — {selectedMode?.title}
          </p>
          <p className="mt-1 text-sm text-slate-600">{selectedMode?.hint}</p>
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            setMode(null);
            setStep(0);
            setPersonalReference("");
          }}
        >
          Changer de mode
        </button>
      </div>

      <div className="flex gap-2">
        {STEPS.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(index)}
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
        <p className="mt-1 text-sm text-slate-500">
          Pas de prompt à écrire. Les références internes FlyerMint restent actives. Ajouter une affiche personnelle
          ne coûte pas de Mint supplémentaire.
        </p>
      </div>

      <div className={step === 0 ? "grid gap-4 md:grid-cols-2" : "hidden"}>
        <Select
          name="visualType"
          label="Type d’affiche"
          options={VISUAL_TYPES.map((item) => ({ value: item, label: item }))}
          defaultValue={selectedMode?.defaultVisualType}
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
        <Input
          name="objective"
          label={mode === "offer" ? "Objectif de l’offre" : mode === "event" ? "Objectif de l’événement" : "Objectif"}
          placeholder="Attirer du monde samedi"
          required
        />
        <Input name="targetAudience" label="Cible" placeholder="Jeunes actifs, familles…" required />
      </div>

      <div className={step === 1 ? "grid gap-4 md:grid-cols-2" : "hidden"}>
        <Input
          name="title"
          label={
            mode === "product"
              ? "Nom du produit / service"
              : mode === "offer"
                ? "Nom de l’offre"
                : mode === "event"
                  ? "Nom de l’événement"
                  : mode === "brand"
                    ? "Nom de marque"
                    : "Titre"
          }
          placeholder="Formation intensive"
          required
        />
        <Input name="subtitle" label={mode === "brand" ? "Slogan" : "Sous-titre"} placeholder="Places limitées" />
        <Input
          name="description"
          label={mode === "offer" ? "Avantages / conditions" : "Texte / offre"}
          placeholder="Ce que les gens doivent retenir"
        />
        <Input name="price" label={mode === "offer" ? "Nouveau prix" : "Prix"} placeholder="25 000 FCFA" />
        <Input name="oldPrice" label="Ancien prix" placeholder="optionnel" />
        {mode === "offer" ? (
          <Input name="newPrice" label="Prix barré / rappel" placeholder="si différent du champ prix" />
        ) : null}
        <Input name="date" label={mode === "event" ? "Date de l’événement" : "Date"} placeholder="15 octobre" />
        <Input name="time" label="Heure" placeholder="19h" />
        <Input name="location" label={mode === "event" ? "Lieu" : "Lieu"} placeholder="Abidjan" />
        <Input name="contactPhone" label="Téléphone" placeholder="+225…" />
        <Input name="whatsapp" label="WhatsApp" placeholder="+225…" />
        <Input name="cta" label="Appel à l’action" placeholder="Inscris-toi maintenant" />
        {mode === "photo" || mode === "product" || mode === "reference_reproduction" ? (
          <label className="space-y-1 text-sm md:col-span-2">
            <span className="font-medium text-slate-700">
              {mode === "photo" ? "Photo principale à transformer" : "Image produit / sujet à intégrer"}
            </span>
            {mainImage ? <p className="text-xs text-[#10B981]">Image produit prête. Elle restera distincte de la référence.</p> : null}
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
        ) : null}
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
        {mode === "photo" || mode === "product" || mode === "reference_reproduction" ? null : (
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
        )}
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Logo (optionnel — mémorisé si tu coches le kit de marque)</span>
          {logoImage ? <p className="text-xs text-[#20C997]">Logo prêt. Il sera intégré, pas redessiné.</p> : null}
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
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Autre image (optionnel)</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={async (event) => {
              try {
                setSecondaryImage(await readImage(event.target.files?.[0]));
              } catch (e) {
                setError(publicErrorMessage(e));
              }
            }}
          />
        </label>

        <PersonalReferenceSection
          locked={personalRefLocked}
          required={needsPersonalRef && canUsePersonalReference}
          preview={personalReference}
          onPick={async (file) => {
            try {
              setPersonalReference(await readImage(file));
              setError(null);
            } catch (e) {
              setError(publicErrorMessage(e));
            }
          }}
          onClear={() => setPersonalReference("")}
        />
      </div>

      <div className={step === 3 ? "space-y-4" : "hidden"}>
        <div className="card p-5 text-sm text-slate-600">
          <p>
            FlyerMint va composer la direction artistique puis générer l’affiche. Cela consomme{" "}
            <strong>1 Mint</strong>.
          </p>
          <p className="mt-2">Mode : {selectedMode?.title}. Les références internes FlyerMint restent utilisées.</p>
          {mainImage ? <p className="mt-2">Ta photo / image produit sera conservée comme sujet (USER_PRODUCT).</p> : null}
          {logoImage ? <p className="mt-2">Ton logo sera réappliqué (USER_LOGO), pas redessiné.</p> : null}
          {secondaryImage ? <p className="mt-2">Une image secondaire sera transmise avec son rôle.</p> : null}
          {personalReference && canUsePersonalReference ? (
            <p className="mt-2">
              Une affiche personnelle servira de grammaire de composition pour cette génération uniquement. Pas de Mint
              supplémentaire.
            </p>
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
          <p className="font-semibold text-[#20C997]">Ton affiche est prête.</p>
          {result.personalReferenceDenied ? (
            <p className="text-sm text-amber-700">
              La référence personnelle est réservée aux packs 20k et 25k. La génération standard FlyerMint a bien
              continué.
            </p>
          ) : null}
          {result.personalReferenceUsed ? (
            <p className="text-sm text-slate-600">
              La composition de votre affiche de référence a été utilisée comme grammaire visuelle, avec vos contenus.
            </p>
          ) : null}
          {result.repaired ? (
            <p className="text-sm text-slate-600">La première version a été corrigée (personne / texte / composition).</p>
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

function PersonalReferenceSection({
  locked,
  required,
  preview,
  onPick,
  onClear,
}: {
  locked: boolean;
  required: boolean;
  preview: string;
  onPick: (file: File | undefined) => Promise<void>;
  onClear: () => void;
}) {
  return (
    <section className="md:col-span-2 rounded-2xl border border-dashed border-violet-200 bg-[#F5F3FF] p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-[#6D28D9]">Référence visuelle personnelle</p>
      <h3 className="mt-1 text-lg font-bold text-[#1E293B]">Vous avez une affiche dont vous aimez la composition ?</h3>
      <p className="mt-1 text-sm text-slate-600">
        Ajoutez-la pour que FlyerMint puisse transposer sa structure visuelle à votre propre contenu.
      </p>
      {locked ? (
        <div className="mt-3 space-y-2">
          <p className="text-sm font-medium text-slate-700">🔒 Disponible avec les packs 20 000 FCFA et 25 000 FCFA.</p>
          <p className="text-xs text-slate-500">
            Vous pouvez continuer une génération standard maintenant. Aucun Mint n’est bloqué par cette option.
          </p>
          <Link href="/pricing" className="btn-secondary">
            Passer à un pack supérieur
          </Link>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <label className="block text-sm">
            <span className="font-medium text-slate-700">
              {required ? "+ Ajouter une affiche de référence (obligatoire pour ce mode)" : "+ Ajouter une affiche de référence"}
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="mt-1 block w-full"
              onChange={(event) => onPick(event.target.files?.[0])}
            />
          </label>
          {preview ? (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Aperçu de l’affiche de référence personnelle" className="h-16 w-12 rounded object-cover" />
              <button type="button" className="text-xs font-semibold text-slate-600 underline" onClick={onClear}>
                Retirer
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Si vous n’ajoutez rien, FlyerMint fonctionne normalement.</p>
          )}
          <p className="text-xs text-slate-500">Disponible avec les packs 20 000 FCFA et 25 000 FCFA. N’utilise pas de Mint supplémentaire.</p>
        </div>
      )}
    </section>
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
