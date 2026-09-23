"use client";

import { FormEvent, useState } from "react";

export function AssistantPanel() {
  const [reply, setReply] = useState<string | null>(null);
  const [escalate, setEscalate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function ask(transfer = false) {
    setLoading(true);
    setError(null);
    const response = await fetch("/api/support/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, transfer }),
    });
    const data = (await response.json()) as { ok?: boolean; reply?: string; escalate?: boolean; error?: string; publicId?: string };
    setLoading(false);
    if (!response.ok || !data.ok) {
      setError(data.error ?? "Une erreur est survenue. Notre équipe a été informée.");
      return;
    }
    setReply(data.reply ?? "");
    setEscalate(Boolean(data.escalate));
    if (data.publicId) setMessage("");
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void ask(false);
  }

  return (
    <section className="card space-y-3 p-5">
      <h2 className="text-lg font-bold">FlyerMint Assistant</h2>
      <p className="text-sm text-slate-600">Questions sur les Mints, les affiches, les paiements et l’export. Aucun solde n’est modifié ici.</p>
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block text-sm font-medium" htmlFor="assistant">
          Ta question
        </label>
        <textarea id="assistant" value={message} onChange={(event) => setMessage(event.target.value)} required rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
        <button className="btn-primary w-full sm:w-auto" disabled={loading} type="submit">
          {loading ? "Réponse…" : "Demander"}
        </button>
      </form>
      {reply ? <p className="rounded-xl bg-violet/5 p-3 text-sm text-slate-700">{reply}</p> : null}
      {escalate ? (
        <button type="button" className="btn-secondary w-full sm:w-auto" onClick={() => void ask(true)} disabled={loading || message.length < 3}>
          Transférer au support
        </button>
      ) : null}
      {error ? <p className="text-sm text-red-600" role="alert">{error}</p> : null}
    </section>
  );
}
