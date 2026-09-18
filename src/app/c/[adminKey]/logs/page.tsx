import { prisma } from "@/lib/prisma";

export default async function AdminLogsPage() {
  const logs = await prisma.adminLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { admin: true },
  });
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-extrabold">Logs</h1>
      {logs.map((log) => (
        <article key={log.id} className="card p-4 text-sm">
          <p className="font-semibold">{log.action}</p>
          <p className="text-slate-500">
            {log.admin.email ?? log.adminUserId} · {log.targetType} · {log.targetId} ·{" "}
            {new Date(log.createdAt).toLocaleString("fr-FR")}
          </p>
        </article>
      ))}
    </div>
  );
}
