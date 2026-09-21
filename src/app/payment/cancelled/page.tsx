import type { Metadata } from "next";
import { PaymentStatusView } from "@/components/payment/payment-status-view";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Paiement annulé"),
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ orderId?: string; token?: string }>;

export default async function PaymentCancelledPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  return (
    <PaymentStatusView
      token={params.token}
      orderId={params.orderId}
      initialStatus="CANCELLED"
    />
  );
}
