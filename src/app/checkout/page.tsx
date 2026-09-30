import { notFound } from "next/navigation";
import { CheckoutForm } from "@/components/payment-button";
import { LAUNCH_OFFER_CODE, OFFICIAL_PLANS } from "@/lib/plans";
import { isStarterOfferLive } from "@/lib/starter-offer";
import { prisma } from "@/lib/prisma";
import { closeExpiredStarterOffer } from "@/server/plans";
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
  await closeExpiredStarterOffer().catch(() => undefined);
  const row = await prisma.plan.findUnique({ where: { code: plan.code } }).catch(() => null);
  if (plan.code === LAUNCH_OFFER_CODE && !isStarterOfferLive(row ?? { active: false, offerEndsAt: null })) notFound();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold">Finaliser l’achat</h1>
        <p className="mt-2 text-slate-600">Le paiement est réel. Tes Mints sont crédités après confirmation.</p>
      </div>
      <CheckoutForm
        planCode={plan.code}
        planName={row?.name ?? plan.name}
        priceFcfa={row?.priceFcfa ?? plan.priceFcfa}
        mintAmount={row?.mintAmount ?? plan.mintAmount}
      />
    </div>
  );
}
