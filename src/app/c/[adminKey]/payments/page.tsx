import { prisma } from "@/lib/prisma";

export default async function AdminPaymentsPage() {
  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: 80,
    include: { plan: true, user: true },
  });
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-extrabold">Payments</h1>
      <div className="space-y-2">
        {payments.map((payment) => (
          <article key={payment.id} className="card p-4 text-sm">
            <p className="font-semibold">
              {payment.plan.name} · {payment.amountFcfa.toLocaleString("fr-FR")} FCFA · {payment.status}
            </p>
            <p className="text-slate-500">
              {payment.user.email ?? payment.userId} · {payment.orderId}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
