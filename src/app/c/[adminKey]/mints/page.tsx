import { prisma } from "@/lib/prisma";

export default async function AdminMintsPage() {
  const [accounts, transactions] = await Promise.all([
    prisma.creditAccount.findMany({ include: { user: true }, take: 50, orderBy: { updatedAt: "desc" } }),
    prisma.creditTransaction.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold">Mints</h1>
      <section className="card p-4">
        <h2 className="font-bold">Soldes</h2>
        <div className="mt-3 space-y-2 text-sm">
          {accounts.map((account) => (
            <p key={account.id}>
              {account.user.email ?? account.userId} · {account.balance} Mints
            </p>
          ))}
        </div>
      </section>
      <section className="card p-4">
        <h2 className="font-bold">Transactions</h2>
        <div className="mt-3 space-y-2 text-sm">
          {transactions.map((tx) => (
            <p key={tx.id}>
              {tx.type} · {tx.amount} · {new Date(tx.createdAt).toLocaleString("fr-FR")}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}
