import { requireAdminUser } from "@/lib/auth";
import { notFound } from "next/navigation";

export default async function AdminReferencesPage() {
  await requireAdminUser();
  notFound();
}
