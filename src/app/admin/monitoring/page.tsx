import { prisma } from "@/lib/prisma";
import { monitoringSnapshot } from "@/server/monitoring";
import { IncidentStatusForm } from "@/components/admin/incident-status-form";

export default async function AdminMonitoringPage() {
  const [snapshot, incidents] = await Promise.all([
    monitoringSnapshot(),
    prisma.incident.findMany({ orderBy: { createdAt: "desc" }, take: 25 }),
  ]);
  const rate = snapshot.generations.failureRate;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold">Monitoring</h1>
      {snapshot.alerts.length ? (
        <ul className="space-y-2">
          {snapshot.alerts.map((alert) => (
            <li key={alert} className="rounded-xl border border-orange/40 bg-orange/10 px-4 py-3 text-sm">
              {alert}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-mint">Aucun seuil dépassé sur la fenêtre actuelle.</p>
      )}
      <section className="grid gap-3 md:grid-cols-2">
        <article className="admin-card p-4 text-sm">
          <h2 className="font-bold">Services</h2>
          <ul className="mt-2 space-y-1">
            <li>Base : {snapshot.database}</li>
            <li>Clerk : {snapshot.clerkConfigured ? "clés présentes" : "non configuré"}</li>
            <li>Money Fusion : {snapshot.moneyFusionConfigured ? "URL présente" : "non configuré"}</li>
            <li>Image : {snapshot.rodium.reachable ? "portefeuille joignable" : "indisponible"}</li>
          </ul>
        </article>
        <article className="admin-card p-4 text-sm">
          <h2 className="font-bold">Générations 24 h</h2>
          <p className="mt-2">Réussies : {snapshot.generations.completed}</p>
          <p>Échouées : {snapshot.generations.failed}</p>
          <p>Taux d’échec : {rate.sufficient && rate.rate !== null ? `${Math.round(rate.rate * 100)} %` : "Données insuffisantes"}</p>
        </article>
        <article className="admin-card p-4 text-sm">
          <h2 className="font-bold">Portefeuille image</h2>
          <p className="mt-2">Libre : {snapshot.rodium.disponible ?? "n/d"}</p>
          <p>Réservé : {snapshot.rodium.reserved ?? "n/d"}</p>
          <p>Total : {snapshot.rodium.balance ?? "n/d"}</p>
          <p>Coût moyen : {snapshot.rodium.avgCost ?? "n/d"}</p>
          <p>Échecs solde : {snapshot.rodium.insufficientIncidents}</p>
        </article>
        <article className="admin-card p-4 text-sm">
          <h2 className="font-bold">Paiements et support</h2>
          <p className="mt-2">Webhooks 24 h : {snapshot.webhooks24h}</p>
          <pre className="mt-2 overflow-auto text-xs">{JSON.stringify(snapshot.payments, null, 2)}</pre>
          <p>Incidents ouverts : {snapshot.support.openIncidents}</p>
          <p>Tickets ouverts : {snapshot.support.openTickets}</p>
          <p>Tickets urgents : {snapshot.support.urgentTickets}</p>
        </article>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-bold">Incidents</h2>
        {incidents.length === 0 ? <p className="text-sm text-slate-500">Aucun incident.</p> : null}
        {incidents.map((incident) => (
          <article key={incident.id} className="admin-card space-y-2 p-4 text-sm">
            <p className="font-semibold">
              {incident.publicId} · {incident.type} · {incident.severity} · {incident.status}
            </p>
            <p>{incident.summary}</p>
            <p className="text-xs text-slate-500">
              {incident.service} · {new Date(incident.createdAt).toLocaleString("fr-FR")}
            </p>
            <IncidentStatusForm incidentId={incident.id} />
          </article>
        ))}
      </section>
    </div>
  );
}
