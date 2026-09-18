import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminUsersClient } from "@/components/admin/admin-users-client";
import { getAdminBasePath } from "@/lib/env";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { creditAccount: true },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-extrabold">Utilisateurs</h1>
      <p className="text-sm text-slate-500">
        Ouvre une fiche : {users.slice(0, 3).map((u) => (
          <Link key={u.id} href={`${getAdminBasePath()}/users/${u.id}`} className="mr-2 text-[#6D28D9]">
            {u.email ?? u.id.slice(0, 8)}
          </Link>
        ))}
      </p>
      <AdminUsersClient
        users={users.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          status: u.status,
          role: u.role,
          balance: u.creditAccount?.balance ?? 0,
        }))}
      />
    </div>
  );
}
