"use client";

import { useState } from "react";

export function FeedbackBox({ generationId, alreadyRated }: { generationId: string; alreadyRated?: boolean }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(alreadyRated ?? false);
  const [hidden, setHidden] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (hidden || done) return done ? <p className="text-xs text-mint">Merci pour ton avis.</p> : null;

  async function send(dismissed = false) {
    setError(null);
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        generationId,
        rating: dismissed ? undefined : rating || undefined,
        comment: dismissed ? undefined : comment,
        dismissed,
      }),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    if (!response.ok || !data.ok) {
      setError(data.error ?? "Avis non enregistré.");
      return;
    }
    if (dismissed) setHidden(true);
    else setDone(true);
  }

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 p-3">
      <p className="text-sm font-semibold">Que pensez-vous de cette affiche ?</p>
      <div className="flex gap-1" role="group" aria-label="Note de 1 à 5">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            aria-label={`${value} étoile${value > 1 ? "s" : ""}`}
            className={`h-9 w-9 rounded-full border text-sm font-bold ${rating >= value ? "border-violet bg-violet text-white" : "border-slate-200"}`}
            onClick={() => setRating(value)}
          >
            {value}
          </button>
        ))}
      </div>
      <label className="block text-xs font-medium" htmlFor={`comment-${generationId}`}>
        Que pouvons-nous améliorer ?
      </label>
      <textarea id={`comment-${generationId}`} value={comment} onChange={(event) => setComment(event.target.value)} rows={2} className="w-full rounded-xl border border-slate-200 px-2 py-1 text-sm" />
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primary" disabled={rating < 1} onClick={() => void send(false)}>
          Envoyer
        </button>
        <button type="button" className="btn-secondary" onClick={() => void send(true)}>
          Plus tard
        </button>
      </div>
      {error ? <p className="text-xs text-red-600" role="alert">{error}</p> : null}
    </div>
  );
}
