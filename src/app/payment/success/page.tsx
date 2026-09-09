import Link from "next/link";

type SearchParams = Promise<{ orderId?: string; token?: string }>;

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  return (
    <div className="card mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-2xl font-bold text-emerald-300">Paiement en traitement</h1>
      <p className="text-white/80">
        Merci. La confirmation finale des Mints se fait cote serveur via webhook/verification.
      </p>
      <p className="text-sm text-white/70">
        orderId: {params.orderId ?? "N/A"} | token: {params.token ?? "N/A"}
      </p>
      <p className="text-sm text-white/70">
        Cette page ne valide jamais seule le paiement.
      </p>
      <Link href="/dashboard" className="inline-block rounded bg-emerald-500 px-4 py-2 font-semibold text-slate-900">
        Retour au dashboard
      </Link>
    </div>
  );
}
