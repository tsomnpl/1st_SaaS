"use client";

import { FormEvent, useMemo, useState } from "react";
import { ADAPTIVE_FIELDS, DOMAINS } from "@/lib/domains";

type Result = {
  generationId: string;
  outputUrl?: string | null;
  costRodi?: number;
  model?: string;
  differentiators?: string[];
  quality?: Record<string, number>;
};

export function CreateFlyerForm() {
  const [domain, setDomain] = useState<(typeof DOMAINS)[number]>("Evenementiel");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const adaptiveFields = useMemo(() => ADAPTIVE_FIELDS[domain] ?? [], [domain]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const form = new FormData(event.currentTarget);
    const adaptiveData = Object.fromEntries(
      adaptiveFields.map((field) => [field, String(form.get(`adaptive_${field}`) ?? "")]),
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
      date: String(form.get("date") ?? ""),
      location: String(form.get("location") ?? ""),
      contactPhone: String(form.get("contactPhone") ?? ""),
      cta: String(form.get("cta") ?? ""),
      style: String(form.get("style") ?? ""),
      mood: String(form.get("mood") ?? ""),
      format: String(form.get("format") ?? "instagram_post"),
      creativeFreedom: String(form.get("creativeFreedom") ?? "liberte_guidee"),
      colors: String(form.get("colors") ?? "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
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
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="card p-5">
        <p className="text-sm text-emerald-300">Cette creation utilisera 1 Mint.</p>
        <h2 className="mt-1 text-xl font-semibold">Questionnaire intelligent</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Input name="visualType" label="Type de visuel" placeholder="Affiche promotionnelle" required />
        <SelectDomain value={domain} onChange={setDomain} />
        <Input name="objective" label="Objectif" placeholder="Attirer des clients" required />
        <Input name="targetAudience" label="Cible" placeholder="Etudiants" required />
        <Input name="title" label="Titre" placeholder="Formation intensive" required />
        <Input name="subtitle" label="Sous-titre" placeholder="Places limitees" />
        <Input name="price" label="Prix (exact)" placeholder="25 000 FCFA" />
        <Input name="date" label="Date" placeholder="15 Octobre" />
        <Input name="location" label="Lieu" placeholder="Abidjan" />
        <Input name="contactPhone" label="Telephone" placeholder="+225..." />
        <Input name="cta" label="CTA" placeholder="Inscris-toi maintenant" />
        <Input name="style" label="Style" placeholder="Premium moderne" />
        <Input name="mood" label="Ambiance" placeholder="Professionnel et energique" />
        <Input name="colors" label="Couleurs (CSV)" placeholder="#111827, #20C997, #FFFFFF" />
        <Input name="format" label="Format" placeholder="instagram_story" required />
        <Input name="creativeFreedom" label="Liberte creative" placeholder="liberte_guidee" required />
      </div>

      {adaptiveFields.length > 0 && (
        <div className="card p-5">
          <h3 className="text-lg font-semibold">Questions adaptees au domaine</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {adaptiveFields.map((field) => (
              <Input key={field} name={`adaptive_${field}`} label={field} placeholder={field} />
            ))}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded bg-emerald-500 px-4 py-2 font-semibold text-slate-900 disabled:opacity-60"
      >
        {loading ? "Generation en cours..." : "Generer mon affiche - 1 Mint"}
      </button>

      {error && <p className="text-sm text-red-300">{error}</p>}
      {result && (
        <div className="card space-y-2 p-5 text-sm">
          <p className="text-emerald-300">Generation creee: {result.generationId}</p>
          <p>Modele: {result.model}</p>
          <p>Cout RODI estime: {result.costRodi}</p>
          <p>Output URL: {result.outputUrl ?? "non fournie par le modele"}</p>
          <p>Differenciateurs: {(result.differentiators ?? []).join(" | ")}</p>
          <p>Quality score global: {result.quality?.overall_score ?? "N/A"}</p>
        </div>
      )}
    </form>
  );
}

function Input({
  name,
  label,
  placeholder,
  required,
}: {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="text-white/80">{label}</span>
      <input
        name={name}
        required={required}
        placeholder={placeholder}
        className="w-full rounded border border-white/20 bg-white/5 px-3 py-2 outline-none ring-emerald-500 focus:ring-2"
      />
    </label>
  );
}

function SelectDomain({
  value,
  onChange,
}: {
  value: (typeof DOMAINS)[number];
  onChange: (value: (typeof DOMAINS)[number]) => void;
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="text-white/80">Domaine</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as (typeof DOMAINS)[number])}
        className="w-full rounded border border-white/20 bg-slate-900 px-3 py-2 outline-none ring-emerald-500 focus:ring-2"
      >
        {DOMAINS.map((domain) => (
          <option key={domain} value={domain}>
            {domain}
          </option>
        ))}
      </select>
    </label>
  );
}
