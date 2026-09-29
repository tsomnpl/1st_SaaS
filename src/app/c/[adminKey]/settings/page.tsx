import { connection } from "next/server";
import { getAdminBasePath, getAppUrl } from "@/lib/env";

export default async function AdminSettingsPage() {
  await connection();
  const env = process.env;
  const configured = {
    clerk: Boolean(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && env.CLERK_SECRET_KEY),
    database: Boolean(env.DATABASE_URL),
    rodium: Boolean(env.RODIUMAI_API_KEY),
    moneyFusion: Boolean(env.MONEY_FUSION_API_URL),
    adminEmail: Boolean(env.ADMIN_EMAIL?.trim()),
    adminClerkIds: Boolean(env.ADMIN_CLERK_USER_IDS?.trim()),
    gmailUser: Boolean(env.GMAIL_USER?.trim()),
    gmailPassword: Boolean(env.GMAIL_APP_PASSWORD?.trim()),
    emailFromName: Boolean(env.EMAIL_FROM_NAME?.trim()),
    privatePath: Boolean(env.ADMIN_PRIVATE_PATH),
    analytics: Boolean(env.NEXT_PUBLIC_ANALYTICS_DOMAIN),
  };

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-extrabold">Paramètres</h1>
      <article className="admin-card space-y-2 p-4 text-sm">
        <p>App URL : {getAppUrl()}</p>
        <p>Chemin studio : {getAdminBasePath()}</p>
        <p>Return URL paiement : {getAppUrl()}/payment/success</p>
        <p>Webhook : {getAppUrl()}/api/webhooks/moneyfusion</p>
        <p>Les secrets restent côté serveur. Cette page n’affiche que leur présence.</p>
      </article>
      <article className="admin-card space-y-2 p-4 text-sm">
        <h2 className="font-bold">Accès au studio</h2>
        <p>
          Le studio s’ouvre si le compte Clerk est dans ADMIN_CLERK_USER_IDS, ou si son e-mail est ADMIN_EMAIL ou GMAIL_USER. Un nouveau ticket est envoyé à ces boîtes, et un accusé part vers l’auteur.
        </p>
        <p>
          Dans le tableau de bord Clerk, ouvre Users, choisis le compte, copie l’identifiant qui commence par user_. Plusieurs identifiants se séparent par une virgule.
        </p>
      </article>
      <article className="admin-card p-4 text-sm">
        <h2 className="font-bold">État de configuration</h2>
        <ul className="mt-3 space-y-1">
          <li>Clerk : {configured.clerk ? "présent" : "manquant"}</li>
          <li>Base de données : {configured.database ? "présente" : "manquante"}</li>
          <li>RodiumAI : {configured.rodium ? "présent" : "manquant"}</li>
          <li>Money Fusion : {configured.moneyFusion ? "présent" : "manquant"}</li>
          <li>ADMIN_CLERK_USER_IDS : {configured.adminClerkIds ? "renseigné" : "à renseigner"}</li>
          <li>ADMIN_EMAIL : {configured.adminEmail ? "renseigné" : "à renseigner"}</li>
          <li>GMAIL_USER : {configured.gmailUser ? "renseigné" : "à renseigner"}</li>
          <li>GMAIL_APP_PASSWORD : {configured.gmailPassword ? "renseigné" : "à renseigner"}</li>
          <li>EMAIL_FROM_NAME : {configured.emailFromName ? "renseigné" : "FlyerMint par défaut"}</li>
          <li>ADMIN_PRIVATE_PATH : {configured.privatePath ? "renseigné" : "manquant, studio fermé"}</li>
          <li>Analytics : {configured.analytics ? "domaine renseigné" : "désactivé"}</li>
        </ul>
      </article>
    </div>
  );
}
