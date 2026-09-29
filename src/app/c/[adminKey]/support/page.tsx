import Link from "next/link";
import { getAdminBasePath } from "@/lib/env";
import { CATEGORY_LABEL, PRIORITY_LABEL, STATUS_LABEL, SUPPORT_CATEGORIES, SUPPORT_PRIORITIES, SUPPORT_STATUSES, formatSupportDate } from "@/lib/support";
import { listAdminTickets, supportStats } from "@/server/support";

type Search = { q?: string; status?: string; priority?: string; category?: string };

export default async function AdminSupportPage({ searchParams }: { searchParams: Promise<Search> }) {
  const query = await searchParams;
  const base = getAdminBasePath();
  const [tickets, stats] = await Promise.all([
    listAdminTickets(query),
    supportStats(),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">Support</h1>
        <p className="mt-1 text-sm text-slate-600">Tickets ouverts, réponses et notes internes.</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["Ouverts", stats.open],
          ["En cours", stats.inProgress],
          ["En attente", stats.waitingUser],
          ["Résolus", stats.resolved],
          ["Fermés", stats.closed],
          ["Urgents actifs", stats.urgent],
        ].map(([label, value]) => (
          <li key={String(label)} className="admin-card p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-extrabold">{value}</p>
          </li>
        ))}
      </ul>
      <form className="admin-card grid gap-3 p-4 md:grid-cols-4" method="get">
        <input name="q" defaultValue={query.q ?? ""} placeholder="Numéro, e-mail, sujet" className="rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-4" />
        <select name="status" defaultValue={query.status ?? ""} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <option value="">Tous les statuts</option>
          {SUPPORT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABEL[status]}
            </option>
          ))}
        </select>
        <select name="priority" defaultValue={query.priority ?? ""} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <option value="">Toutes les priorités</option>
          {SUPPORT_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {PRIORITY_LABEL[priority]}
            </option>
          ))}
        </select>
        <select name="category" defaultValue={query.category ?? ""} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <option value="">Toutes les catégories</option>
          {SUPPORT_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {CATEGORY_LABEL[category]}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-secondary">
          Filtrer
        </button>
      </form>
      <ul className="space-y-2">
        {tickets.length === 0 ? <li className="text-sm text-slate-500">Aucun ticket.</li> : null}
        {tickets.map((ticket) => (
          <li key={ticket.ticketNumber}>
            <Link href={`${base}/support/${ticket.ticketNumber}`} className="admin-card block p-4">
              <p className="text-xs font-semibold text-[#6D28D9]">#{ticket.ticketNumber}</p>
              <p className="font-semibold">{ticket.subject}</p>
              <p className="mt-1 text-sm text-slate-600">
                {ticket.categoryLabel} · {ticket.priorityLabel} · {ticket.statusLabel}
                {ticket.userEmail ? ` · ${ticket.userEmail}` : ""}
              </p>
              <p className="mt-1 text-xs text-slate-500">{formatSupportDate(ticket.updatedAt)}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
