import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminBasePath } from "@/lib/env";

type Params = Promise<{ userId: string }>;

export default async function AdminUserDetailPage({ params }: { params: Params }) {
  const { userId } = await params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      creditAccount: true,
      creditTransactions: { orderBy: { createdAt: "desc" }, take: 30 },
      payments: { include: { plan: true }, orderBy: { createdAt: "desc" }, take: 20 },
      generations: { orderBy: { createdAt: "desc" }, take: 20 },
      creditBuckets: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!user) notFound();
  const paid = user.payments.filter((p) => p.status === "COMPLETED").reduce((sum, p) => sum + p.amountFcfa, 0);
  const used = user.creditTransactions.filter((t) => t.type === "GENERATION").reduce((s, t) => s + Math.abs(t.amount), 0);
  const expired = user.creditTransactions.filter((t) => t.type === "EXPIRATION").reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <div className="space-y-6">
      <Link href={`${getAdminBasePath()}/users`} className="text-sm text-[#6D28D9]">
        ← Utilisateurs
      </Link>
      <h1 className="text-3xl font-extrabold">{user.email ?? user.id}</h1>
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
        ].map(([label, value]) => (
          <article key={label} className="card p-4">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-1 font-semibold">{value}</p>
          </article>
        ))}
      </div>
      <section className="card p-4">
        <h2 className="font-bold">Lots de Mints</h2>
        <div className="mt-3 space-y-2 text-sm">
          {user.creditBuckets.map((bucket) => (
            <p key={bucket.id}>
              {bucket.remainingAmount}/{bucket.totalAmount} · {bucket.sourceType} ·{" "}
              {bucket.expiresAt ? `expire ${bucket.expiresAt.toLocaleDateString("fr-FR")}` : "sans expiration"}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}
