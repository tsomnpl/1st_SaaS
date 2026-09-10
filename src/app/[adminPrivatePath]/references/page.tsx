import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/auth";
import { getAdminPrivatePath } from "@/lib/env";
import { AdminReferencesContent } from "@/components/admin/admin-references-content";

type Params = Promise<{ adminPrivatePath: string }>;

export default async function PrivateAdminReferencesPage({
  params,
}: {
  params: Params;
}) {
  await requireAdminUser();
  const { adminPrivatePath } = await params;
  if (adminPrivatePath !== getAdminPrivatePath()) {
    notFound();
  }
  return <AdminReferencesContent />;
}
