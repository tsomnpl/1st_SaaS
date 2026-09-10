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
      <h1 className="text-2xl font-bold text-[#20C997]">Paiement recu</h1>
      <p className="text-white/80">
        Merci. Tes Mints seront credites automatiquement des que le paiement est confirme.
        Tu peux revenir au dashboard dans un instant.
      </p>
      {params.orderId || params.token ? (
        <p className="text-sm text-white/50">
          Reference: {params.orderId ?? params.token}
        </p>
      ) : null}
      <Link href="/dashboard" className="inline-block rounded bg-emerald-500 px-4 py-2 font-semibold text-slate-900">
        Retour au dashboard
      </Link>
    </div>
  );
}
