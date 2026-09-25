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
      <h1 className="text-2xl font-extrabold text-mint">Paiement reçu</h1>
      <p className="text-slate-600">
        Merci. Tes Mints seront crédités automatiquement dès que le paiement est confirmé
        par Money Fusion. Cette page n’est pas une preuve de paiement.
      </p>
      {params.orderId || params.token ? (
        <p className="text-sm text-slate-400">Référence : {params.orderId ?? params.token}</p>
      ) : null}
      <div className="flex gap-3">
        <Link href="/dashboard" className="btn-primary">
          Tableau de bord
        </Link>
        <Link href="/create" className="btn-secondary">
          Créer une affiche
        </Link>
      </div>
    </div>
  );
}
