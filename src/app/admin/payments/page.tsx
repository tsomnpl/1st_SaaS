import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAdminBasePath } from "@/lib/env";

type SearchParams = Promise<{ status?: string }>;

export default async function AdminPaymentsPage({ searchParams }: { searchParams: SearchParams }) {
  const status = (await searchParams).status;
  const payments = await prisma.payment.findMany({
    where: status ? { status: status as never } : undefined,
    orderBy: { createdAt: "desc" },
    take: 120,
    include: { plan: true, user: true },
  });
  const webhooks = await prisma.webhookEvent.count();
  const base = getAdminBasePath();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Paiements</h1>
          <p className="text-sm text-slate-500">{webhooks} événements webhook enregistrés.</p>
        </div>
        <a href="/api/admin/export?type=payments" className="btn-secondary">Export CSV</a>
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        {["", "PENDING", "COMPLETED", "CANCELLED", "FAILED"].map((value) => (
          <Link
            key={value || "all"}
            href={value ? `${base}/payments?status=${value}` : `${base}/payments`}
            className={`rounded-full px-3 py-1 ${status === value || (!status && !value) ? "bg-night text-white" : "border border-slate-200 bg-white"}`}
          >
            {value || "Tous"}
          </Link>
        ))}
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-[920px] w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-3 py-2">Utilisateur</th>
              <th className="px-3 py-2">Plan</th>
              <th className="px-3 py-2">Montant</th>
              <th className="px-3 py-2">orderId</th>
              <th className="px-3 py-2">Token</th>
              <th className="px-3 py-2">Statut</th>
              <th className="px-3 py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="border-t border-slate-100">
                <td className="px-3 py-2">{payment.user.email ?? payment.userId}</td>
                <td className="px-3 py-2">{payment.plan.name}</td>
                <td className="px-3 py-2">{payment.amountFcfa.toLocaleString("fr-FR")}</td>
                <td className="px-3 py-2">
                  <Link href={`${base}/payments/${payment.id}`} className="text-violet">
                    {payment.orderId}
                  </Link>
                </td>
                <td className="px-3 py-2">{payment.tokenPay ?? "—"}</td>
                <td className="px-3 py-2">{payment.status}</td>
                <td className="px-3 py-2">{payment.createdAt.toLocaleString("fr-FR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
