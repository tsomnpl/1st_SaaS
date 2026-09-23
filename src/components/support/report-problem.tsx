import Link from "next/link";

export function ReportProblemLink({
  generationId,
  paymentId,
  label = "Signaler un problème",
}: {
  generationId?: string;
  paymentId?: string;
  label?: string;
}) {
  const params = new URLSearchParams();
  if (generationId) params.set("generationId", generationId);
  if (paymentId) params.set("paymentId", paymentId);
  if (generationId) params.set("subject", "Cette affiche ne respecte pas ma demande.");
  const href = `/support/new?${params.toString()}`;
  return (
    <Link href={href} className="text-sm font-semibold text-orange hover:underline">
      {label}
    </Link>
  );
}
