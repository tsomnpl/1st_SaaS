export function paymentCanBeDiscarded(payment: {
  status: string;
  creditedAt: Date | string | null;
  creditedByPurchase: boolean;
}) {
  if (payment.creditedAt) return false;
  if (payment.creditedByPurchase) return false;
  return payment.status === "PENDING" || payment.status === "FAILED";
}
