import { prisma } from "@/lib/prisma";

type SearchParams = Promise<{ type?: string }>;

export default async function AdminMintsPage({ searchParams }: { searchParams: SearchParams }) {
  const type = (await searchParams).type;
  const [accounts, transactions] = await Promise.all([
    prisma.creditAccount.findMany({ include: { user: true }, take: 80, orderBy: { updatedAt: "desc" } }),
    prisma.creditTransaction.findMany({
      where: type ? { type: type as never } : undefined,
      orderBy: { createdAt: "desc" },
      take: 80,
      include: { user: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-extrabold">Mints</h1>
        <a href="/api/admin/export?type=mints" className="btn-secondary">Export ledger</a>
      </div>
      <form className="flex flex-wrap gap-2">
        <select name="type" defaultValue={type ?? ""} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
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
              {account.user.email ?? account.userId} · {account.balance} Mints
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
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}
