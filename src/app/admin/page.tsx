import { requireAdminUser } from "@/lib/auth";
import { notFound } from "next/navigation";

export default async function AdminPage() {
  await requireAdminUser();
  notFound();
}
