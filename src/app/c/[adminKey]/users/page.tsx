import { prisma } from "@/lib/prisma";
import { AdminUsersClient } from "@/components/admin/admin-users-client";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { creditAccount: true },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-extrabold">Users</h1>
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
