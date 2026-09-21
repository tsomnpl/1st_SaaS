import { prisma } from "@/lib/prisma";
import { AdminUsersClient } from "@/components/admin/admin-users-client";
import { getAdminBasePath } from "@/lib/env";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { creditAccount: true },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Utilisateurs</h1>
          <p className="text-sm text-slate-500">{users.length} comptes chargés · fiche détaillée au clic.</p>
        </div>
        <a href="/api/admin/export?type=users" className="btn-secondary">Export CSV</a>
      </div>
      <AdminUsersClient
        basePath={getAdminBasePath()}
        users={users.map((user) => ({
          id: user.id,
          email: user.email,
          name: user.name,
          status: user.status,
          role: user.role,
          balance: user.creditAccount?.balance ?? 0,
          createdAt: user.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
