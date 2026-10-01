"use client";

export default function PageError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="card mx-auto max-w-xl space-y-4 p-6">
      <h1 className="text-2xl font-extrabold text-[#1E293B]">Cette page n’a pas pu s’ouvrir</h1>
      <p className="text-slate-600">Le chargement a échoué. Ton compte et tes affiches sont toujours là.</p>
      <button type="button" className="btn-primary" onClick={() => reset()}>
        Réessayer
      </button>
    </div>
  );
}
