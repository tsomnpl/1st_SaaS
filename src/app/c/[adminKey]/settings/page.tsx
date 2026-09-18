import { getAdminBasePath, getAppUrl } from "@/lib/env";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-extrabold">Settings</h1>
      <article className="card space-y-2 p-4 text-sm">
        <p>App URL : {getAppUrl()}</p>
        <p>Chemin studio : {getAdminBasePath()}</p>
        <p>Return URL paiement : {getAppUrl()}/payment/success</p>
        <p>Webhook : {getAppUrl()}/api/webhooks/moneyfusion</p>
      </article>
    </div>
  );
}
