import { prisma } from "@/lib/prisma";

type SearchParams = Promise<{ q?: string }>;

export default async function AdminLogsPage({ searchParams }: { searchParams: SearchParams }) {
  const q = (await searchParams).q?.trim();
  const [logs, webhooks] = await Promise.all([
    prisma.adminLog.findMany({
      where: q
        ? {
            OR: [
              { action: { contains: q, mode: "insensitive" } },
              { targetType: { contains: q, mode: "insensitive" } },
              { targetId: { contains: q } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      take: 120,
      include: { admin: true },
    }),
    prisma.webhookEvent.findMany({ orderBy: { createdAt: "desc" }, take: 40 }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-extrabold">Logs</h1>
      <form>
        <input name="q" defaultValue={q} placeholder="Action, cible…" className="w-full rounded-xl border border-slate-200 px-3 py-2" />
      </form>
      {logs.map((log) => (
        <article key={log.id} className="admin-card p-4 text-sm">
          <p className="font-semibold">{log.action}</p>
          <p className="text-slate-500">
            {log.admin.email ?? log.adminUserId} · {log.targetType} · {log.targetId} ·{" "}
            {log.createdAt.toLocaleString("fr-FR")}
          </p>
        </article>
      ))}
      <section className="admin-card p-4">
        <h2 className="font-bold">Webhooks</h2>
        <div className="mt-3 space-y-2 text-sm">
          {webhooks.map((event) => (
            <p key={event.id}>
              {event.createdAt.toLocaleString("fr-FR")} · {event.provider} · {event.eventKey}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}
