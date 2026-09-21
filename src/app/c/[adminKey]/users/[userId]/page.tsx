import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminBasePath } from "@/lib/env";
import { AdminMintForm } from "@/components/admin/admin-mint-form";
import { AdminUserActions } from "@/components/admin/admin-user-actions";

type Params = Promise<{ userId: string }>;

export default async function AdminUserDetailPage({ params }: { params: Params }) {
  const { userId } = await params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      creditAccount: true,
      creditTransactions: { orderBy: { createdAt: "desc" }, take: 40 },
      payments: { include: { plan: true }, orderBy: { createdAt: "desc" }, take: 20 },
      generations: { orderBy: { createdAt: "desc" }, take: 20 },
      creditBuckets: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!user) notFound();
  const paid = user.payments.filter((payment) => payment.status === "COMPLETED").reduce((sum, payment) => sum + payment.amountFcfa, 0);
  const used = user.creditTransactions.filter((tx) => tx.type === "GENERATION").reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const expired = user.creditTransactions.filter((tx) => tx.type === "EXPIRATION").reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const lastActivity = [
    user.updatedAt,
    user.generations[0]?.createdAt,
    user.payments[0]?.createdAt,
    user.creditTransactions[0]?.createdAt,
  ]
    .filter(Boolean)
    .sort((left, right) => (right as Date).getTime() - (left as Date).getTime())[0];

  return (
    <div className="space-y-6">
      <Link href={`${getAdminBasePath()}/users`} className="text-sm text-[#20C997]">
        ← Utilisateurs
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">{user.email ?? user.id}</h1>
          <p className="text-sm text-slate-500">{user.name ?? "Sans nom"} · {user.clerkUserId}</p>
        </div>
        <AdminUserActions userId={user.id} status={user.status} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["Statut", user.status],
          ["Rôle", user.role],
          ["Inscription", user.createdAt.toLocaleDateString("fr-FR")],
          ["Mints dispo", String(user.creditAccount?.balance ?? 0)],
          ["Mints utilisés", String(used)],
          ["Mints expirés", String(expired)],
          ["Total payé", `${paid.toLocaleString("fr-FR")} FCFA`],
          ["Générations", String(user.generations.length)],
          ["Dernière activité", lastActivity ? new Date(lastActivity).toLocaleString("fr-FR") : "n/a"],
        ].map(([label, value]) => (
          <article key={label} className="admin-card p-4">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-1 font-semibold">{value}</p>
          </article>
        ))}
      </div>
      <AdminMintForm userId={user.id} />
      <section className="admin-card p-4">
        <h2 className="font-bold">Lots de Mints</h2>
        <div className="mt-3 space-y-2 text-sm">
          {user.creditBuckets.length === 0 ? <p className="text-slate-500">Aucun lot.</p> : null}
          {user.creditBuckets.map((bucket) => (
            <p key={bucket.id}>
              {bucket.remainingAmount}/{bucket.totalAmount} · {bucket.sourceType} ·{" "}
              {bucket.expiresAt ? `expire ${bucket.expiresAt.toLocaleDateString("fr-FR")}` : "sans expiration"}
            </p>
          ))}
        </div>
      </section>
      <section className="admin-card p-4">
        <h2 className="font-bold">Historique Mints</h2>
        <div className="mt-3 space-y-2 text-sm">
          {user.creditTransactions.map((tx) => (
            <p key={tx.id}>
              {new Date(tx.createdAt).toLocaleString("fr-FR")} · {tx.type} · {tx.amount} · {tx.balanceBefore} → {tx.balanceAfter}
            </p>
          ))}
        </div>
      </section>
      <section className="admin-card p-4">
        <h2 className="font-bold">Paiements</h2>
        <div className="mt-3 space-y-2 text-sm">
          {user.payments.map((payment) => (
            <Link key={payment.id} href={`${getAdminBasePath()}/payments/${payment.id}`} className="block hover:text-[#20C997]">
              {payment.plan.name} · {payment.amountFcfa.toLocaleString("fr-FR")} FCFA · {payment.status} · {payment.orderId}
            </Link>
          ))}
        </div>
      </section>
      <section className="admin-card p-4">
        <h2 className="font-bold">Générations</h2>
        <div className="mt-3 space-y-2 text-sm">
          {user.generations.map((generation) => (
            <p key={generation.id}>
              {new Date(generation.createdAt).toLocaleString("fr-FR")} · {generation.status} · {generation.model}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}
