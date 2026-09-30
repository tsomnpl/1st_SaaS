"use client";

import { useState } from "react";
import { referralPath } from "@/lib/referral-code";

export function ReferralCard({
  code,
  invited,
  rewarded,
  rows,
}: {
  code: string;
  invited: number;
  rewarded: number;
  rows: Array<{ id: string; status: string; rewardedAt: string | null }>;
}) {
  const [copied, setCopied] = useState(false);
  const path = referralPath(code);
  const link = typeof window === "undefined" ? path : `${window.location.origin}${path}`;

  async function copyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}${path}`);
    setCopied(true);
  }

  async function shareLink() {
    const url = `${window.location.origin}${path}`;
    if (typeof navigator.share === "function") {
      await navigator.share({ title: "FlyerMint", text: "Invitez un ami sur FlyerMint.", url });
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
  }

  return (
    <section className="card space-y-4 p-6">
      <div>
        <h2 className="text-xl font-bold">Parrainer un ami</h2>
        <p className="mt-1 text-sm text-slate-600">Invitez un ami et gagnez 1 Mint lorsqu&apos;il crée son compte.</p>
      </div>
      <p className="font-mono text-lg font-bold tracking-wide text-[#1E293B]">{code}</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn-primary" onClick={() => void copyLink()}>
          {copied ? "Lien copié" : "Copier le lien"}
        </button>
        <button type="button" className="btn-secondary" onClick={() => void shareLink()}>
          Partager
        </button>
      </div>
      <p suppressHydrationWarning className="break-all text-xs text-slate-500">
        {link}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm">Invités : {invited}</p>
        <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm">Récompenses : {rewarded} Mint{rewarded > 1 ? "s" : ""}</p>
      </div>
      {rows.length ? (
        <ul className="space-y-2 text-sm">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
              <span>Compte créé</span>
              <span className="text-slate-500">{row.status === "REWARDED" ? "Bonus versé" : row.status}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
