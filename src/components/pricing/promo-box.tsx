"use client";

import { FormEvent, useState } from "react";
import { useCopy } from "@/components/chrome/locale-provider";
import { publishWalletChange } from "@/lib/wallet-events";

export function PromoBox() {
  const t = useCopy();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const value = code.trim();
    if (!value) {
      setOk(false);
      setMessage(t.promo.placeholder);
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/promo/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: value }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string; mintAmount?: number; balanceAfter?: number };
      if (!data.ok) {
        setOk(false);
        setMessage(data.error === "UNAUTHORIZED" || response.status === 401 ? t.promo.signIn : data.error ?? t.promo.signIn);
        return;
      }
      setOk(true);
      setCode("");
      setMessage(
        t.promo.added
          .replace("{mints}", String(data.mintAmount ?? 0))
          .replace("{balance}", String(data.balanceAfter ?? 0)),
      );
      publishWalletChange();
    } catch {
      setOk(false);
      setMessage(t.promo.signIn);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-xl rounded-2xl border border-[#6D28D9]/20 bg-[#F5F3FF] p-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6D28D9]">{t.promo.kicker}</p>
      <h2 className="mt-2 text-2xl font-extrabold text-[#1E293B]">{t.promo.title}</h2>
      <p className="mt-2 text-sm text-slate-600">{t.promo.lead}</p>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder={t.promo.placeholder}
          autoComplete="off"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold uppercase tracking-wide text-slate-800"
        />
        <button type="submit" disabled={loading} className="btn-mint shrink-0">
          {loading ? "…" : t.promo.apply}
        </button>
      </form>
      {message ? <p className={`mt-3 text-sm ${ok ? "text-[#047857]" : "text-amber-700"}`}>{message}</p> : null}
      <p className="mt-3 text-xs text-slate-500">{t.promo.signIn}</p>
    </section>
  );
}
