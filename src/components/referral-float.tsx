"use client";

import { useAuth } from "@clerk/nextjs";
import { useState } from "react";
import { referralPath } from "@/lib/referral-code";

type ReferralPayload = {
  code: string;
  invited: number;
  rewarded: number;
};

export function ReferralFloat() {
  const { isSignedIn } = useAuth();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [info, setInfo] = useState<ReferralPayload | null>(null);

  if (!isSignedIn) return null;

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (!next || info) return;
    const response = await fetch("/api/me/referral");
    const data = (await response.json()) as { ok?: boolean; code?: string; invited?: number; rewarded?: number };
    if (!data.ok || !data.code) return;
    setInfo({ code: data.code, invited: data.invited ?? 0, rewarded: data.rewarded ?? 0 });
  }

  async function copyLink() {
    if (!info) return;
    await navigator.clipboard.writeText(`${window.location.origin}${referralPath(info.code)}`);
    setCopied(true);
  }

  return (
    <div className="relative">
      {open ? (
        <div className="card absolute bottom-full right-0 mb-3 w-[min(18rem,calc(100vw-2rem))] space-y-3 p-4 text-sm shadow-[0_12px_40px_rgba(15,23,42,0.16)]">
          <p className="font-semibold">Invitez un ami et gagnez 1 Mint lorsqu&apos;il crée son compte.</p>
          <p className="font-mono text-base font-bold tracking-wide">{info?.code ?? "..."}</p>
          <button type="button" className="btn-primary w-full" onClick={() => void copyLink()} disabled={!info}>
            {copied ? "Lien copié" : "Copier le lien"}
          </button>
          {info ? (
            <p className="text-xs text-slate-500">
              Invités : {info.invited}. Récompenses : {info.rewarded} Mint{info.rewarded > 1 ? "s" : ""}.
            </p>
          ) : null}
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => void toggle()}
        className="rounded-xl bg-[#6D28D9] px-3 py-2 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(30,41,59,0.12)] hover:bg-[#5B21B6]"
      >
        Parrainer
      </button>
    </div>
  );
}
