import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/auth";
import { getAdminPrivatePath } from "@/lib/env";
import { AdminDashboardContent } from "@/components/admin/admin-dashboard-content";

type Params = Promise<{ adminPrivatePath: string }>;

export default async function PrivateAdminPage({
  params,
}: {
  params: Params;
}) {
  await requireAdminUser();
  const { adminPrivatePath } = await params;
  if (adminPrivatePath !== getAdminPrivatePath()) {
    notFound();
  }
  return <AdminDashboardContent />;
}
