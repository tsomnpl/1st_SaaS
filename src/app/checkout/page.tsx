import { notFound } from "next/navigation";
import { CheckoutForm } from "@/components/payment-button";
import { OFFICIAL_PLANS } from "@/lib/plans";
import { requireActiveCurrentUser } from "@/server/users";

type SearchParams = Promise<{ plan?: string }>;

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireActiveCurrentUser();
  const { plan: planCode } = await searchParams;
  const plan = OFFICIAL_PLANS.find((item) => item.code === planCode && item.priceFcfa > 0);
  if (!plan) notFound();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold">Finaliser l’achat</h1>
        <p className="mt-2 text-slate-600">Le paiement est réel. Tes Mints sont crédités après confirmation.</p>
      </div>
      <CheckoutForm
        planCode={plan.code}
        planName={plan.name}
        priceFcfa={plan.priceFcfa}
        mintAmount={plan.mintAmount}
      />
    </div>
  );
}
