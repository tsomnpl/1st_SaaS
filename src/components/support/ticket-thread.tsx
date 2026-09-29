"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { formatSupportDate } from "@/lib/support";

type Message = {
  authorType: "USER" | "SUPPORT";
  content: string;
  createdAt: string;
  attachments: Array<{ id: string; fileName: string }>;
};

export function TicketThread({
  ticketNumber,
  messages,
  closed,
}: {
  ticketNumber: string;
  messages: Message[];
  closed: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const message = String(new FormData(form).get("message") ?? "");
    setPending(true);
    setError("");
    const response = await fetch(`/api/support/tickets/${ticketNumber}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    setPending(false);
    if (!response.ok) {
      setError(payload?.error || "Le message n’a pas été envoyé.");
      return;
    }
    form.reset();
    router.refresh();
  }

  async function sendFile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = new FormData(form);
    setPending(true);
    setError("");
    const response = await fetch(`/api/support/tickets/${ticketNumber}/attachments`, { method: "POST", body });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    setPending(false);
    if (!response.ok) {
      setError(payload?.error || "La pièce jointe a été refusée.");
      return;
    }
    form.reset();
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <ol className="space-y-3">
        {messages.map((message) => (
          <li key={`${message.createdAt}-${message.authorType}-${message.content.slice(0, 12)}`} className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {message.authorType === "SUPPORT" ? "Support" : "Toi"} · {formatSupportDate(message.createdAt)}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{message.content}</p>
            {message.attachments.length ? (
              <ul className="mt-2 space-y-1 text-sm">
                {message.attachments.map((file) => (
                  <li key={file.id}>
                    <a className="font-semibold text-[#6D28D9]" href={`/api/support/attachments/${file.id}`}>
                      {file.fileName}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ol>
      <form onSubmit={sendMessage} className="card space-y-3 p-4">
        <label className="block text-sm font-semibold" htmlFor="reply">
          {closed ? "Réouvrir avec un message" : "Répondre"}
        </label>
        <textarea id="reply" name="message" required minLength={2} maxLength={4000} rows={4} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button type="submit" className="btn-primary" disabled={pending}>
          Envoyer
        </button>
      </form>
      <form onSubmit={sendFile} className="card space-y-3 p-4">
        <label className="block text-sm font-semibold" htmlFor="capture">
          Ajouter une capture
        </label>
        <input id="capture" name="file" type="file" required accept="image/png,image/jpeg,image/webp" className="block w-full text-sm" />
        <button type="submit" className="btn-secondary" disabled={pending}>
          Joindre
        </button>
      </form>
    </div>
  );
}
