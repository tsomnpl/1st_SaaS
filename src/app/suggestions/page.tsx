import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { pageTitle } from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import { requireActiveCurrentUser } from "@/server/users";
import { SuggestionForm } from "@/components/support/suggestion-form";
import { VoteButton } from "@/components/support/vote-button";

export const metadata: Metadata = { title: pageTitle("Suggestions"), robots: { index: false, follow: false } };

const STATUS: Record<string, string> = {
  NEW: "Nouveau",
  REVIEWING: "En revue",
  PLANNED: "Planifié",
  IN_PROGRESS: "En cours",
  RELEASED: "Publié",
  DECLINED: "Décliné",
};

export default async function SuggestionsPage() {
  let user;
  try {
    user = await requireActiveCurrentUser();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") redirect("/sign-in?redirect_url=/suggestions");
    throw error;
  }
  const mine = await prisma.suggestion.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { votes: true } } },
  });
  const open = await prisma.suggestion.findMany({
    where: { status: { in: ["PLANNED", "IN_PROGRESS", "REVIEWING"] } },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { _count: { select: { votes: true } }, votes: { where: { userId: user.id }, select: { id: true } } },
  });

  return (
    <div className="page-canvas space-y-6">
      <h1 className="text-3xl font-extrabold">Suggestions</h1>
      <SuggestionForm />
      <section className="space-y-3">
        <h2 className="text-xl font-bold">Les miennes</h2>
        {mine.length === 0 ? <p className="text-sm text-slate-500">Aucune suggestion envoyée.</p> : null}
        {mine.map((item) => (
          <article key={item.id} className="card p-4">
            <p className="font-semibold">{item.title}</p>
            <p className="text-sm text-slate-500">
              {STATUS[item.status] ?? item.status} · {item._count.votes} vote{item._count.votes > 1 ? "s" : ""}
            </p>
          </article>
        ))}
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-bold">En cours de revue</h2>
        {open.length === 0 ? <p className="text-sm text-slate-500">Rien en revue pour le moment.</p> : null}
        {open.map((item) => (
          <article key={item.id} className="card flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">{item.title}</p>
              <p className="text-sm text-slate-500">{STATUS[item.status]}</p>
            </div>
            <VoteButton suggestionId={item.id} voted={item.votes.length > 0} />
          </article>
        ))}
      </section>
    </div>
  );
}
