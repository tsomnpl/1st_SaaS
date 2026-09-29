import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminTicketDesk } from "@/components/admin/admin-ticket-desk";
import { getAdminBasePath } from "@/lib/env";
import { formatSupportDate } from "@/lib/support";
import { getAdminTicket } from "@/server/support";

export default async function AdminTicketPage({ params }: { params: Promise<{ ticketNumber: string }> }) {
  const { ticketNumber } = await params;
  const ticket = await getAdminTicket(ticketNumber).catch((error: unknown) => {
    if (error instanceof Error && error.message === "NOT_FOUND") return null;
    throw error;
  });
  if (!ticket) notFound();
  const base = getAdminBasePath();
  const context = ticket.context as {
    generation?: { generationId?: string; status?: string; model?: string; rodiCost?: number | null; error?: string | null; hasOutput?: boolean };
    payment?: { orderId?: string; amountFcfa?: number; status?: string; planName?: string; paymentId?: string };
  } | null;

  return (
    <div className="space-y-5">
      <Link href={`${base}/support`} className="text-sm font-semibold text-[#6D28D9]">
        Retour aux tickets
      </Link>
      <header>
        <p className="text-sm font-semibold text-[#6D28D9]">#{ticket.ticketNumber}</p>
        <h1 className="text-2xl font-extrabold">{ticket.subject}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {ticket.userName || "Utilisateur"}
          {ticket.userEmail ? ` · ${ticket.userEmail}` : ""} · {formatSupportDate(ticket.createdAt)}
        </p>
        <p className="text-sm text-slate-600">
          {ticket.categoryLabel} · {ticket.priorityLabel} · {ticket.statusLabel}
        </p>
      </header>
      {context?.generation || context?.payment ? (
        <aside className="admin-card space-y-2 p-4 text-sm">
          <p className="font-semibold">Contexte</p>
          {context.generation ? (
            <p>
              Génération {context.generation.status} · {context.generation.model}
              {typeof context.generation.rodiCost === "number" ? ` · coût RODI ${context.generation.rodiCost}` : ""}
              {context.generation.hasOutput ? " · affiche disponible" : ""}
              {context.generation.error ? ` · ${context.generation.error}` : ""}
            </p>
          ) : null}
          {context.payment ? (
            <p>
              Paiement {context.payment.orderId} · {context.payment.planName} · {context.payment.amountFcfa} FCFA · {context.payment.status}
              {context.payment.paymentId ? (
                <>
                  {" "}
                  <Link className="font-semibold text-[#6D28D9]" href={`${base}/payments/${context.payment.paymentId}`}>
                    Ouvrir le paiement
                  </Link>
                </>
              ) : null}
            </p>
          ) : null}
        </aside>
      ) : null}
      <ol className="space-y-3">
        {ticket.messages.map((message) => (
          <li key={`${message.createdAt}-${message.isInternal}-${message.content.slice(0, 16)}`} className="admin-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {message.isInternal ? "Note interne" : message.authorType === "SUPPORT" ? "Support" : "Utilisateur"} · {formatSupportDate(message.createdAt)}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm">{message.content}</p>
          </li>
        ))}
      </ol>
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
      <AdminTicketDesk ticketNumber={ticket.ticketNumber} status={ticket.status} priority={ticket.priority} events={ticket.emailEvents} />
    </div>
  );
}
