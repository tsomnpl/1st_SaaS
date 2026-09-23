import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORY_LABEL, PRIORITY_LABEL, STATUS_LABEL } from "@/lib/support-policy";
import { prisma } from "@/lib/prisma";
import { AdminTicketActions } from "@/components/admin/support-actions";

export default async function AdminTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, name: true } },
      messages: { orderBy: { createdAt: "asc" }, include: { author: { select: { role: true, email: true } } } },
      attachments: true,
      events: { orderBy: { createdAt: "asc" } },
      assignments: { orderBy: { createdAt: "desc" }, take: 5 },
      generation: { select: { id: true, status: true, model: true, rodiCost: true, outputUrl: true } },
      payment: { select: { id: true, orderId: true, amountFcfa: true, status: true, createdAt: true } },
    },
  });
  if (!ticket) notFound();

  return (
    <div className="space-y-5">
      <Link href="/admin/support" className="text-sm font-semibold text-violet">
        Tous les tickets
      </Link>
      <header>
        <p className="text-xs font-semibold text-violet">{ticket.publicId}</p>
        <h1 className="text-2xl font-extrabold">{ticket.subject}</h1>
        <p className="text-sm text-slate-500">
          {STATUS_LABEL[ticket.status]} · {PRIORITY_LABEL[ticket.priority]} · {CATEGORY_LABEL[ticket.category]}
        </p>
        <p className="text-sm text-slate-500">
          {ticket.user.name ?? "Utilisateur"} · {ticket.user.email ?? "e-mail non affiché"}
        </p>
      </header>
      <section className="admin-card space-y-2 p-4 text-sm">
        <h2 className="font-bold">Contexte</h2>
        {ticket.generation ? (
          <p>
            Génération {ticket.generation.id} · {ticket.generation.status} · {ticket.generation.model}
            {ticket.generation.rodiCost != null ? ` · coût ${ticket.generation.rodiCost}` : ""}
          </p>
        ) : (
          <p>Aucune génération liée.</p>
        )}
        {ticket.payment ? (
          <p>
            Paiement {ticket.payment.orderId} · {ticket.payment.amountFcfa} FCFA · {ticket.payment.status}
          </p>
        ) : (
          <p>Aucun paiement lié.</p>
        )}
        <pre className="overflow-auto rounded-xl bg-slate-50 p-3 text-xs">{JSON.stringify(ticket.contextInternal ?? ticket.contextPublic ?? {}, null, 2)}</pre>
      </section>
      <ol className="space-y-2">
        {ticket.messages.map((message) => (
          <li key={message.id} className={`rounded-xl border p-3 text-sm ${message.visibility === "INTERNAL" ? "border-orange/40 bg-orange/5" : "border-slate-200 bg-white"}`}>
            <p className="text-xs text-slate-500">
              {message.visibility === "INTERNAL" ? "Note interne" : "Message"} · {message.author.role} · {new Date(message.createdAt).toLocaleString("fr-FR")}
            </p>
            <p className="mt-1 whitespace-pre-wrap">{message.body}</p>
          </li>
        ))}
      </ol>
      <ul className="text-sm">
        {ticket.attachments.map((file) => (
          <li key={file.id}>
            <a className="font-semibold text-violet" href={`/api/support/attachments/${file.id}`}>
              {file.fileName}
            </a>
          </li>
        ))}
      </ul>
      <section className="text-xs text-slate-500">
        <h2 className="font-bold text-slate-700">Historique</h2>
        <ul className="mt-2 space-y-1">
          {ticket.events.map((event) => (
            <li key={event.id}>
              {event.type} · {new Date(event.createdAt).toLocaleString("fr-FR")}
            </li>
          ))}
        </ul>
        <p className="mt-2">File : {ticket.assignments[0]?.queue ?? "SUPPORT"}</p>
      </section>
      <AdminTicketActions ticketId={ticket.id} />
    </div>
  );
}
