import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { pageTitle } from "@/lib/seo";
import { CATEGORY_LABEL, STATUS_LABEL } from "@/lib/support-policy";
import { requireActiveCurrentUser } from "@/server/users";
import { listOwnTickets } from "@/server/support";
import { AssistantPanel } from "@/components/support/assistant-panel";

export const metadata: Metadata = { title: pageTitle("Centre d’aide"), robots: { index: false, follow: false } };

export default async function SupportPage() {
  let user;
  try {
    user = await requireActiveCurrentUser();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") redirect("/sign-in?redirect_url=/support");
    throw error;
  }
  const { items } = await listOwnTickets(user.id);

  return (
    <div className="page-canvas space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Centre d’aide</h1>
          <p className="mt-1 text-slate-600">Demandes, réponses et assistant FlyerMint.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/support/new" className="btn-primary">
            Nouvelle demande
          </Link>
          <Link href="/notifications" className="btn-secondary">
            Notifications
          </Link>
          <Link href="/help" className="btn-secondary">
            FAQ
          </Link>
        </div>
      </div>
      <AssistantPanel />
      <section className="space-y-3">
        <h2 className="text-xl font-bold">Mes demandes</h2>
        {items.length === 0 ? (
          <p className="card p-6 text-sm text-slate-500">Aucune demande pour le moment.</p>
        ) : (
          items.map((ticket) => (
            <Link key={ticket.id} href={`/support/${ticket.id}`} className="card block p-4 hover:border-violet/30">
              <p className="text-xs font-semibold text-violet">{ticket.publicId}</p>
              <p className="mt-1 font-semibold">{ticket.subject}</p>
              <p className="mt-1 text-sm text-slate-500">
                {CATEGORY_LABEL[ticket.category]} · {STATUS_LABEL[ticket.status]}
              </p>
            </Link>
          ))
        )}
      </section>
    </div>
  );
}
