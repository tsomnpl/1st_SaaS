import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CATEGORY_LABEL, PRIORITY_LABEL, STATUS_LABEL, TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES } from "@/lib/support-policy";
import { listAdminTickets } from "@/server/support";
import { supportDashboardStats } from "@/server/monitoring";

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const query = await searchParams;
  const [{ items, total }, stats] = await Promise.all([
    listAdminTickets({
      status: query.status,
      priority: query.priority,
      category: query.category,
      queue: query.queue,
      q: query.q,
      page: Number(query.page ?? "1"),
    }),
    supportDashboardStats(),
  ]);
  const agents = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true, email: true }, take: 20 });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold">Support</h1>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Ouverts" value={String((stats.byStatus.NEW ?? 0) + (stats.byStatus.OPEN ?? 0) + (stats.byStatus.IN_PROGRESS ?? 0) + (stats.byStatus.WAITING_USER ?? 0))} />
        <Stat label="Urgents / hauts" value={String((stats.byPriority.URGENT ?? 0) + (stats.byPriority.HIGH ?? 0))} />
        <Stat label="Nouveaux" value={String(stats.byStatus.NEW ?? 0)} />
        <Stat label="Résolus" value={String(stats.byStatus.RESOLVED ?? 0)} />
        <Stat label="1re réponse (h)" value={stats.avgFirstResponseHours === null ? "Données insuffisantes" : stats.avgFirstResponseHours.toFixed(1)} />
        <Stat label="Résolution (h)" value={stats.avgResolutionHours === null ? "Données insuffisantes" : stats.avgResolutionHours.toFixed(1)} />
        <Stat label="Satisfaction" value={stats.satisfaction === null ? "Données insuffisantes" : `${stats.satisfaction.toFixed(1)} / 5`} />
        <Stat label="Agents admin" value={String(agents.length)} />
      </section>
      <form className="admin-card grid gap-3 p-4 md:grid-cols-3">
        <input name="q" defaultValue={query.q ?? ""} placeholder="Ticket, e-mail, id" className="rounded-xl border border-slate-200 px-3 py-2" />
        <Select name="status" value={query.status} options={["ALL", ...TICKET_STATUSES]} labels={STATUS_LABEL} />
        <Select name="priority" value={query.priority} options={["ALL", ...TICKET_PRIORITIES]} labels={PRIORITY_LABEL} />
        <Select name="category" value={query.category} options={["ALL", ...TICKET_CATEGORIES]} labels={CATEGORY_LABEL} />
        <select name="queue" defaultValue={query.queue ?? "ALL"} className="rounded-xl border border-slate-200 px-3 py-2">
          {["ALL", "SUPPORT", "BILLING", "TECHNICAL", "ADMIN"].map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <button className="btn-primary" type="submit">
          Filtrer
        </button>
      </form>
      <p className="text-sm text-slate-500">{total} demande{total > 1 ? "s" : ""}</p>
      <div className="space-y-2">
        {items.length === 0 ? <p className="text-sm text-slate-500">Aucun ticket pour ces filtres.</p> : null}
        {items.map((ticket) => (
          <Link key={ticket.id} href={`/admin/support/${ticket.id}`} className="admin-card block p-4">
            <p className="text-xs font-semibold text-violet">{ticket.publicId}</p>
            <p className="font-semibold">{ticket.subject}</p>
            <p className="text-sm text-slate-500">
              {STATUS_LABEL[ticket.status]} · {PRIORITY_LABEL[ticket.priority]} · {CATEGORY_LABEL[ticket.category]} · {ticket.user.email ?? "e-mail masqué"}
            </p>
          </Link>
        ))}
      </div>
      <section className="admin-card p-4 text-sm">
        <h2 className="font-bold">Par jour (7 jours)</h2>
        {stats.perDay.length === 0 ? <p className="mt-2 text-slate-500">Données insuffisantes</p> : null}
        <ul className="mt-2 space-y-1">
          {stats.perDay.map(([day, count]) => (
            <li key={day}>
              {day} — {count}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <article className="admin-card p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-extrabold">{value}</p>
    </article>
  );
}

function Select({
  name,
  value,
  options,
  labels,
}: {
  name: string;
  value?: string;
  options: string[];
  labels: Record<string, string>;
}) {
  return (
    <select name={name} defaultValue={value ?? "ALL"} className="rounded-xl border border-slate-200 px-3 py-2">
      {options.map((item) => (
        <option key={item} value={item}>
          {item === "ALL" ? "Tous" : labels[item] ?? item}
        </option>
      ))}
    </select>
  );
}
