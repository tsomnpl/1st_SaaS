import type { ReactNode } from "react";
import { forbidden, notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminBasePath, getAdminPrivatePath } from "@/lib/env";
import { requireAdminUser } from "@/lib/auth";
import { logAdminSession } from "@/server/admin-audit";
import { pageTitle } from "@/lib/seo";

export const metadata = {
  title: pageTitle("Administration"),
  robots: { index: false, follow: false },
};

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
    const admin = await requireAdminUser();
    await logAdminSession(admin.id);
    return (
      <AdminShell
        basePath={getAdminBasePath()}
        adminLabel={admin.name ?? admin.email ?? "Administrateur"}
      >
        {children}
      </AdminShell>
    );
  } catch {
    forbidden();
  }
}
