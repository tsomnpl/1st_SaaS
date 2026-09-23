import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { pageTitle } from "@/lib/seo";
import { currentUserIsAdmin } from "@/lib/auth";
import { CATEGORY_LABEL, PRIORITY_LABEL, STATUS_LABEL } from "@/lib/support-policy";
import { requireActiveCurrentUser } from "@/server/users";
import { getTicketForActor } from "@/server/support";
import { TicketThread } from "@/components/support/ticket-thread";

export const metadata: Metadata = { title: pageTitle("Demande"), robots: { index: false, follow: false } };

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  let user;
  try {
    user = await requireActiveCurrentUser();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") redirect("/sign-in?redirect_url=/support");
    throw error;
  }
  const { id } = await params;
  let ticket;
  try {
    ticket = await getTicketForActor({ ticketId: id, actorId: user.id, isAdmin: await currentUserIsAdmin() });
  } catch (error) {
    if (error instanceof Error && (error.message === "NOT_FOUND" || error.message === "FORBIDDEN")) notFound();
    throw error;
  }
  const context = (ticket.contextPublic ?? {}) as { title?: string; status?: string; amountFcfa?: number };

  return (
    <div className="page-canvas space-y-5">
      <Link href="/support" className="text-sm font-semibold text-violet">
        Retour au centre d’aide
      </Link>
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet">{ticket.publicId}</p>
        <h1 className="mt-1 text-3xl font-extrabold">{ticket.subject}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {CATEGORY_LABEL[ticket.category]} · {PRIORITY_LABEL[ticket.priority]} · {STATUS_LABEL[ticket.status]}
        </p>
        {context.title || context.status || context.amountFcfa ? (
          <p className="mt-2 text-sm text-slate-500">
            Contexte : {context.title ? context.title : ""} {context.status ? `· ${context.status}` : ""}{" "}
            {context.amountFcfa ? `· ${context.amountFcfa} FCFA` : ""}
          </p>
        ) : null}
      </header>
      <ol className="space-y-3">
        {ticket.messages?.map((message) => (
          <li key={message.id} className="card p-4">
            <p className="text-xs text-slate-500">{new Date(message.createdAt).toLocaleString("fr-FR")}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm">{message.body}</p>
          </li>
        ))}
      </ol>
      {ticket.attachments?.length ? (
        <ul className="space-y-2 text-sm">
          {ticket.attachments.map((file) => (
            <li key={file.id}>
              <a className="font-semibold text-violet" href={`/api/support/attachments/${file.id}`}>
                {file.fileName}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
      <TicketThread ticketId={ticket.id} canClose={ticket.status !== "CLOSED"} />
    </div>
  );
}
