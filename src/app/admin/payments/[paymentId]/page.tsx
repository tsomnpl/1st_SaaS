import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminBasePath } from "@/lib/env";

type Params = Promise<{ paymentId: string }>;

export default async function AdminPaymentDetailPage({ params }: { params: Params }) {
  const { paymentId } = await params;
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { user: true, plan: true },
  });
  if (!payment) notFound();
  const events = payment.tokenPay
    ? await prisma.webhookEvent.findMany({
        where: { eventKey: { contains: payment.tokenPay } },
        orderBy: { createdAt: "desc" },
        take: 20,
      })
    : [];

  return (
    <div className="space-y-4">
      <Link href={`${getAdminBasePath()}/payments`} className="text-sm text-[#6D28D9]">
        ← Paiements
      </Link>
      <h1 className="text-3xl font-extrabold">{payment.orderId}</h1>
      <div className="grid gap-3 md:grid-cols-2">
        {[
          ["Utilisateur", payment.user.email ?? payment.userId],
          ["Plan", payment.plan.name],
          ["Montant", `${payment.amountFcfa.toLocaleString("fr-FR")} FCFA`],
          ["Statut", payment.status],
          ["Token", payment.tokenPay ?? "—"],
          ["Webhook", payment.webhookState ?? "—"],
          ["Crédit", payment.creditedAt ? payment.creditedAt.toLocaleString("fr-FR") : "non crédité"],
          ["Créé", payment.createdAt.toLocaleString("fr-FR")],
        ].map(([label, value]) => (
          <article key={label} className="admin-card p-4">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-1 font-semibold break-all">{value}</p>
          </article>
        ))}
      </div>
      <section className="admin-card p-4">
        <h2 className="font-bold">Événements webhook</h2>
        <div className="mt-3 space-y-2 text-sm">
          {events.length === 0 ? <p className="text-slate-500">Aucun événement lié à ce token.</p> : null}
          {events.map((event) => (
            <p key={event.id}>
              {event.createdAt.toLocaleString("fr-FR")} · {event.eventKey}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}
