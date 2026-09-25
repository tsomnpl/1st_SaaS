import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="mx-auto max-w-lg py-20 text-center">
      <p className="text-sm font-semibold text-violet">403</p>
      <h1 className="mt-2 text-3xl font-extrabold">Accès refusé</h1>
      <p className="mt-2 text-slate-600">Tu n’as pas l’autorisation d’ouvrir cette page.</p>
      <Link href="/dashboard" className="btn-primary mt-6">
        Retour au tableau de bord
      </Link>
    </div>
  );
}
