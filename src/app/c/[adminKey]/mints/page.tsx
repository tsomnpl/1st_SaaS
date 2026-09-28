import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/auth";
import { getAdminBasePath } from "@/lib/env";
import { AdminMintForm } from "@/components/admin/admin-mint-form";
import { AdminMintGrantForm, CancelMintGrantButton } from "@/components/admin/admin-mint-grant-form";
import { listRecentMintGrants } from "@/server/mint-grants";

type SearchParams = Promise<{ type?: string }>;

function reasonOf(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || !("reason" in metadata)) return "";
  const reason = (metadata as { reason?: unknown }).reason;
  return typeof reason === "string" ? reason : "";
}

export default async function AdminMintsPage({ searchParams }: { searchParams: SearchParams }) {
  const type = (await searchParams).type;
  const admin = await requireAdminUser();
  const [accounts, transactions, grants, giftedUnused] = await Promise.all([
    prisma.creditAccount.findMany({ include: { user: true }, take: 80, orderBy: { updatedAt: "desc" } }),
    prisma.creditTransaction.findMany({
      where: type ? { type: type as never } : undefined,
      orderBy: { createdAt: "desc" },
      take: 80,
      include: { user: true },
    }),
    listRecentMintGrants(40),
    prisma.creditBucket.aggregate({
      where: { sourceType: "ADMIN_ADD", remainingAmount: { gt: 0 } },
      _sum: { remainingAmount: true },
    }),
  ]);
  const adminAccount = accounts.find((account) => account.userId === admin.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Mints</h1>
          <p className="mt-1 text-sm text-slate-500">
            Mints offerts encore non utilisés : {giftedUnused._sum.remainingAmount ?? 0}. Ils ne comptent pas comme des Mints vendus.
          </p>
        </div>
        <a href="/api/admin/export?type=mints" className="btn-secondary">Export ledger</a>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Mon compte</h2>
        <p className="text-sm text-slate-500">
          {admin.email ?? admin.id} · solde {adminAccount?.balance ?? 0} Mint{(adminAccount?.balance ?? 0) > 1 ? "s" : ""}
        </p>
        <AdminMintForm userId={admin.id} />
      </section>

      <AdminMintGrantForm />

      <section className="admin-card p-4">
        <h2 className="font-bold">Attributions préparées</h2>
        <div className="mt-3 space-y-3 text-sm">
          {grants.length === 0 ? <p className="text-slate-500">Aucune attribution.</p> : null}
          {grants.map((grant) => (
            <div key={grant.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <p>
                {grant.email} · {grant.amount} · {grant.status} · {grant.reason}
                {grant.user ? ` · utilisé par ${grant.user.email ?? grant.userId}` : ""}
                {grant.expiresAt ? ` · expire ${grant.expiresAt.toLocaleDateString("fr-FR")}` : ""}
              </p>
              {grant.status === "PENDING" ? <CancelMintGrantButton grantId={grant.id} /> : null}
            </div>
          ))}
        </div>
      </section>

      <form className="flex flex-wrap gap-2">
        <select name="type" defaultValue={type ?? ""} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <option value="">Tous les types</option>
          {["FREE_GRANT", "PURCHASE", "GENERATION", "REFUND", "BONUS", "ADMIN_ADD", "ADMIN_REMOVE", "EXPIRATION"].map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
        <button className="btn-secondary" type="submit">Filtrer</button>
      </form>
      <section className="admin-card p-4">
        <h2 className="font-bold">Soldes</h2>
        <div className="mt-3 space-y-2 text-sm">
          {accounts.map((account) => (
            <p key={account.id}>
              <Link href={`${getAdminBasePath()}/users/${account.userId}`} className="text-[#6D28D9]">
                {account.user.email ?? account.userId}
              </Link>
              {" · "}
              {account.balance} Mints
            </p>
          ))}
        </div>
      </section>
      <section className="admin-card p-4">
        <h2 className="font-bold">Ledger</h2>
        <div className="mt-3 space-y-2 text-sm">
          {transactions.map((tx) => (
            <p key={tx.id}>
              {tx.createdAt.toLocaleString("fr-FR")} · {tx.user.email ?? tx.userId} · {tx.type} · {tx.amount} · {tx.balanceBefore} → {tx.balanceAfter}
              {reasonOf(tx.metadata) ? ` · ${reasonOf(tx.metadata)}` : ""}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}
