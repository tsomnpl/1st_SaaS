import type { ReactNode } from "react";
import { forbidden, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminBasePath } from "@/lib/env";
import { requireAdminUser } from "@/lib/auth";
import { logAdminSession } from "@/server/admin-audit";
import { pageTitle } from "@/lib/seo";

export const metadata = {
  title: pageTitle("Administration"),
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  let userId: string | null = null;
  try {
    const session = await auth();
    userId = session.userId;
  } catch {
    userId = null;
  }
  if (!userId) {
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
