import { prisma } from "@/lib/prisma";
import { SuggestionStatusForm } from "@/components/admin/suggestion-status-form";

export default async function AdminSuggestionsPage() {
  const items = await prisma.suggestion.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { _count: { select: { votes: true } }, user: { select: { email: true } } },
  });
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-extrabold">Suggestions</h1>
      {items.length === 0 ? <p className="text-sm text-slate-500">Aucune suggestion.</p> : null}
      {items.map((item) => (
        <article key={item.id} className="admin-card space-y-2 p-4">
          <p className="font-semibold">{item.title}</p>
          <p className="text-sm text-slate-600">{item.body}</p>
          <p className="text-xs text-slate-500">
            {item.category} · {item._count.votes} votes · {item.user.email ?? "e-mail masqué"}
          </p>
          <SuggestionStatusForm suggestionId={item.id} status={item.status} />
        </article>
      ))}
    </div>
  );
}
