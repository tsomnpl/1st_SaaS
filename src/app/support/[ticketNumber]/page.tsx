import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pageTitle } from "@/lib/seo";
import { formatSupportDate } from "@/lib/support";
import { TicketThread } from "@/components/support/ticket-thread";
import { getUserTicket } from "@/server/support";
import { requireActiveCurrentUser } from "@/server/users";

export const metadata: Metadata = {
  title: pageTitle("Ticket"),
  robots: { index: false, follow: false },
};

export default async function TicketPage({ params }: { params: Promise<{ ticketNumber: string }> }) {
  const user = await requireActiveCurrentUser();
  const { ticketNumber } = await params;
  const ticket = await getUserTicket(user.id, ticketNumber).catch((error: unknown) => {
    if (error instanceof Error && error.message === "NOT_FOUND") return null;
    throw error;
  });
  if (!ticket) notFound();
  const context = ticket.context as {
    generation?: { status?: string; model?: string; createdAt?: string; error?: string | null };
    payment?: { orderId?: string; amountFcfa?: number; status?: string; planName?: string; createdAt?: string };
  } | null;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/support" className="text-sm font-semibold text-[#6D28D9]">
        Retour aux tickets
      </Link>
      <header>
        <p className="text-sm font-semibold text-[#6D28D9]">#{ticket.ticketNumber}</p>
        <h1 className="mt-1 text-3xl font-extrabold">{ticket.subject}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {ticket.categoryLabel} · {ticket.priorityLabel} · {ticket.statusLabel} · {formatSupportDate(ticket.createdAt)}
        </p>
      </header>
      {context?.generation || context?.payment ? (
        <aside className="card space-y-2 p-4 text-sm text-slate-700">
          <p className="font-semibold">Contexte</p>
          {context.generation ? (
            <p>
              Génération {context.generation.status} · {context.generation.model}
              {context.generation.error ? ` · ${context.generation.error}` : ""}
            </p>
          ) : null}
          {context.payment ? (
            <p>
              Paiement {context.payment.orderId} · {context.payment.planName} · {context.payment.amountFcfa} FCFA · {context.payment.status}
            </p>
          ) : null}
        </aside>
      ) : null}
      {ticket.attachments.length ? (
        <ul className="text-sm">
          {ticket.attachments.map((file) => (
            <li key={file.id}>
              <a className="font-semibold text-[#6D28D9]" href={`/api/support/attachments/${file.id}`}>
                {file.fileName}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
      <TicketThread
        ticketNumber={ticket.ticketNumber}
        closed={ticket.status === "RESOLVED" || ticket.status === "CLOSED"}
        messages={ticket.messages.map((message) => ({
          authorType: message.authorType,
          content: message.content,
          createdAt: message.createdAt,
          attachments: message.attachments,
        }))}
      />
    </div>
  );
}
