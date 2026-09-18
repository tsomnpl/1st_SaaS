import { getAdminStats } from "@/server/admin-stats";

export default async function AdminAnalyticsPage() {
  const stats = await getAdminStats();
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-extrabold">Analytics</h1>
      <div className="grid gap-3 md:grid-cols-2">
        <article className="card p-4">CA {stats.revenue.toLocaleString("fr-FR")} FCFA</article>
        <article className="card p-4">{stats.generations} générations</article>
        <article className="card p-4">{stats.mintsSold} Mints vendus</article>
        <article className="card p-4">{stats.mintsConsumed} Mints consommés</article>
      </div>
    </div>
  );
}
