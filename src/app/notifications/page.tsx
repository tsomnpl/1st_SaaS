import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { pageTitle } from "@/lib/seo";
import { requireActiveCurrentUser } from "@/server/users";
import { listNotifications } from "@/server/notifications";
import { NotificationList } from "@/components/support/notification-list";

export const metadata: Metadata = { title: pageTitle("Notifications"), robots: { index: false, follow: false } };

export default async function NotificationsPage() {
  let user;
  try {
    user = await requireActiveCurrentUser();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") redirect("/sign-in?redirect_url=/notifications");
    throw error;
  }
  const items = await listNotifications(user.id);
  return (
    <div className="page-canvas space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold">Notifications</h1>
        <Link href="/support" className="text-sm font-semibold text-violet">
          Centre d’aide
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="card p-6 text-sm text-slate-500">Aucune notification.</p>
      ) : (
        <NotificationList
          items={items.map((item) => ({
            id: item.id,
            title: item.title,
            body: item.body,
            href: item.href,
            read: Boolean(item.readAt),
            createdAt: item.createdAt.toISOString(),
          }))}
        />
      )}
    </div>
  );
}
