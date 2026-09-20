"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DOMAINS, DOMAIN_LABELS, FORMATS } from "@/lib/domains";

export function LandingBriefTeaser() {
  const [domain, setDomain] = useState<(typeof DOMAINS)[number]>("Evenementiel");
  const [title, setTitle] = useState("");
  const [format, setFormat] = useState("instagram_post");

  const href = useMemo(() => {
    const params = new URLSearchParams({ domain, format });
    if (title.trim()) params.set("title", title.trim());
    return `/create?${params.toString()}`;
  }, [domain, format, title]);

  return (
    <form className="space-y-3" action={href} method="get">
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-600">Domaine</span>
        <select
          name="domain"
          value={domain}
          onChange={(event) => setDomain(event.target.value as (typeof DOMAINS)[number])}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          {DOMAINS.map((item) => (
            <option key={item} value={item}>
              {DOMAIN_LABELS[item]}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-600">Titre de l’affiche</span>
        <input
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Ex. Menu du soir"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-600">Format</span>
        <select
          name="format"
          value={format}
          onChange={(event) => setFormat(event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          {FORMATS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <Link href={href} className="btn-primary mt-2 inline-flex">
        Continuer le brief
      </Link>
    </form>
  );
}
