import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { pageTitle } from "@/lib/seo";
import { requireActiveCurrentUser } from "@/server/users";
import { NewTicketForm } from "@/components/support/new-ticket-form";

export const metadata: Metadata = { title: pageTitle("Nouvelle demande"), robots: { index: false, follow: false } };

export default async function NewSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ generationId?: string; paymentId?: string; subject?: string; format?: string }>;
}) {
  try {
    await requireActiveCurrentUser();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") redirect("/sign-in?redirect_url=/support/new");
    throw error;
  }
  const query = await searchParams;
  const description = query.generationId
    ? "Cette affiche ne respecte pas ma demande."
    : query.paymentId
      ? "Un paiement nécessite une vérification."
      : "";
  return (
    <div className="page-canvas space-y-4">
      <h1 className="text-3xl font-extrabold">Nouvelle demande</h1>
      <NewTicketForm
        generationId={query.generationId ?? ""}
        paymentId={query.paymentId ?? ""}
        defaultSubject={query.subject ?? ""}
        defaultDescription={query.format ? `${description}\nFormat : ${query.format}` : description}
      />
    </div>
  );
}
