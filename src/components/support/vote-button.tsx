"use client";

import { useState } from "react";

export function VoteButton({ suggestionId, voted }: { suggestionId: string; voted: boolean }) {
  const [done, setDone] = useState(voted);
  const [error, setError] = useState<string | null>(null);

  async function vote() {
    setError(null);
    const response = await fetch(`/api/suggestions/${suggestionId}/vote`, { method: "POST" });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    if (!response.ok || !data.ok) {
      setError(data.error ?? "Vote impossible.");
      return;
    }
    setDone(true);
  }

  return (
    <div>
      <button type="button" className="btn-secondary" disabled={done} onClick={() => void vote()}>
        {done ? "Voté" : "Voter"}
      </button>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
