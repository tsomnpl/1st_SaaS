import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminBasePath, getAdminPrivatePath } from "@/lib/env";
import { requireAdminUser } from "@/lib/auth";

type Params = Promise<{ adminKey: string }>;

export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Params;
}) {
  const { adminKey } = await params;
  if (adminKey !== getAdminPrivatePath()) {
    notFound();
  }

  const session = await auth();
  if (!session.userId) {
    redirect(`/sign-in?redirect_url=${encodeURIComponent(getAdminBasePath())}`);
  }

  try {
    await requireAdminUser();
  } catch {
    notFound();
  }

  return <AdminShell basePath={getAdminBasePath()}>{children}</AdminShell>;
}
