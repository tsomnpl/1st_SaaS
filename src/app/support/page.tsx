import type { Metadata } from "next";
import Link from "next/link";
import { pageTitle } from "@/lib/seo";
import { formatSupportDate } from "@/lib/support";
import { getDictionary } from "@/lib/locale";
import { listUserTickets } from "@/server/support";
import { requireActiveCurrentUser } from "@/server/users";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return {
    title: pageTitle(t.support.title),
    robots: { index: false, follow: false },
  };
}

export default async function SupportPage() {
  const { t } = await getDictionary();
  const user = await requireActiveCurrentUser();
  const tickets = await listUserTickets(user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">{t.support.title}</h1>
          <p className="mt-1 max-w-xl text-slate-600">{t.support.lead}</p>
        </div>
        <Link href="/support/nouveau" className="btn-primary">
          {t.support.new}
        </Link>
      </div>
      {tickets.length === 0 ? (
        <div className="card p-8 text-slate-500">{t.support.empty}</div>
      ) : (
        <ul className="space-y-3">
          {tickets.map((ticket) => (
            <li key={ticket.ticketNumber}>
              <Link href={`/support/${ticket.ticketNumber}`} className="card block p-4 hover:border-slate-300">
                <p className="text-xs font-semibold text-[#6D28D9]">#{ticket.ticketNumber}</p>
                <p className="mt-1 font-semibold">{ticket.subject}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {ticket.categoryLabel} · {ticket.priorityLabel} · {ticket.statusLabel}
                </p>
                <p className="mt-1 text-xs text-slate-500">{formatSupportDate(ticket.updatedAt)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
