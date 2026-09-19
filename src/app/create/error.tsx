"use client";

import Link from "next/link";

export default function CreateError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="card mx-auto max-w-xl space-y-4 p-6">
      <h1 className="text-2xl font-extrabold">La création n’a pas pu s’ouvrir</h1>
      <p className="text-slate-600">
        Une erreur serveur a bloqué le formulaire. Réessaie — ton compte est déjà connecté.
      </p>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn-primary" onClick={() => retry()}>
          Réessayer
        </button>
        <Link href="/dashboard" className="btn-secondary">
          Tableau de bord
        </Link>
      </div>
    </div>
  );
}
