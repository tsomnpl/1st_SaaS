"use client";

import { useState } from "react";

export function IncidentStatusForm({ incidentId }: { incidentId: string }) {
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function update(status: string) {
    setError(null);
    const response = await fetch(`/api/admin/incidents/${incidentId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    if (!response.ok || !data.ok) {
      setError(data.error ?? "Mise à jour impossible.");
      return;
    }
    setInfo(status);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {["INVESTIGATING", "MITIGATED", "RESOLVED", "CLOSED"].map((status) => (
        <button key={status} type="button" className="btn-secondary" onClick={() => void update(status)}>
          {status}
        </button>
      ))}
      {info ? <span className="text-xs text-mint">{info}</span> : null}
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
