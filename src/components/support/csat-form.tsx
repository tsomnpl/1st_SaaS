"use client";

import { useState } from "react";

export function CsatForm({ ticketId }: { ticketId: string }) {
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (done) return <p className="card p-4 text-sm text-mint">Merci, ta note est enregistrée.</p>;

  async function send() {
    setError(null);
    const response = await fetch(`/api/support/tickets/${ticketId}/csat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score, comment: comment || undefined }),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    if (!response.ok || !data.ok) {
      setError(data.error ?? "Note non enregistrée.");
      return;
    }
    setDone(true);
  }

  return (
    <section className="card space-y-3 p-4">
      <p className="font-semibold">Comment s’est passée l’aide du support ?</p>
      <div className="flex gap-2" role="radiogroup" aria-label="Note de 1 à 5">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={score === value}
            onClick={() => setScore(value)}
            className={`h-10 w-10 rounded-full border text-sm font-bold ${score === value ? "border-violet bg-violet text-white" : "border-slate-200 bg-white"}`}
          >
            {value}
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        rows={2}
        maxLength={1000}
        placeholder="Un commentaire (optionnel)"
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
      />
      {error ? <p className="text-sm text-red-600" role="alert">{error}</p> : null}
      <button type="button" className="btn-primary" disabled={score === 0} onClick={send}>
        Envoyer ma note
      </button>
    </section>
  );
}
