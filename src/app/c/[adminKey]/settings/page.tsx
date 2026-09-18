import { getAdminBasePath, getAppUrl } from "@/lib/env";

export default function AdminSettingsPage() {
  const configured = {
    clerk: Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY),
    database: Boolean(process.env.DATABASE_URL),
    rodium: Boolean(process.env.RODIUMAI_API_KEY),
    moneyFusion: Boolean(process.env.MONEY_FUSION_API_URL),
    adminEmail: Boolean(process.env.ADMIN_EMAIL),
    privatePath: Boolean(process.env.ADMIN_PRIVATE_PATH),
    analytics: Boolean(process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN),
  };

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-extrabold">Paramètres</h1>
      <article className="admin-card space-y-2 p-4 text-sm">
        <p>App URL : {getAppUrl()}</p>
        <p>Chemin studio : {getAdminBasePath()}</p>
        <p>Return URL paiement : {getAppUrl()}/payment/success</p>
        <p>Webhook : {getAppUrl()}/api/webhooks/moneyfusion</p>
        <p>ADMIN_EMAIL : configuré côté serveur uniquement (jamais affiché).</p>
      </article>
      <article className="admin-card p-4 text-sm">
        <h2 className="font-bold">État de configuration</h2>
        <ul className="mt-3 space-y-1">
          <li>Clerk : {configured.clerk ? "présent" : "manquant"}</li>
          <li>Base de données : {configured.database ? "présente" : "manquante"}</li>
          <li>RodiumAI : {configured.rodium ? "présent" : "manquant"}</li>
          <li>Money Fusion : {configured.moneyFusion ? "présent" : "manquant"}</li>
          <li>ADMIN_EMAIL : {configured.adminEmail ? "renseigné" : "à renseigner"}</li>
          <li>ADMIN_PRIVATE_PATH : {configured.privatePath ? "renseigné" : "valeur de secours locale"}</li>
          <li>Analytics : {configured.analytics ? "domaine renseigné" : "désactivé"}</li>
        </ul>
      </article>
    </div>
  );
}
