import type { Metadata } from "next";
import Link from "next/link";
import { pageTitle } from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import { reportReasonLabel } from "@/lib/support";
import { NewTicketForm } from "@/components/support/new-ticket-form";
import { requireActiveCurrentUser } from "@/server/users";

export const metadata: Metadata = {
  title: pageTitle("Nouveau ticket"),
  robots: { index: false, follow: false },
};

type Search = { generation?: string; payment?: string; motif?: string };

export default async function NewTicketPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await requireActiveCurrentUser();
  const query = await searchParams;
  const [generations, payments] = await Promise.all([
    prisma.generation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, brief: true, createdAt: true, status: true },
    }),
    prisma.payment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { plan: true },
    }),
  ]);
  const generationId = generations.some((row) => row.id === query.generation) ? query.generation ?? "" : "";
  const paymentId = payments.some((row) => row.id === query.payment) ? query.payment ?? "" : "";
  const reason = reportReasonLabel(query.motif);
  const category = generationId ? "GENERATION" : paymentId ? "PAYMENT" : "OTHER";

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/support" className="text-sm font-semibold text-[#6D28D9]">
        Retour aux tickets
      </Link>
      <h1 className="text-3xl font-extrabold">Nouveau ticket</h1>
      <NewTicketForm
        generations={generations.map((row) => {
          const title = String((row.brief as { title?: string })?.title ?? "Affiche");
          return { id: row.id, label: `${title} · ${row.status} · ${row.createdAt.toLocaleDateString("fr-FR")}` };
        })}
        payments={payments.map((row) => ({
          id: row.id,
          label: `${row.plan.name} · ${row.amountFcfa} FCFA · ${row.orderId} · ${row.status}`,
        }))}
        initial={{
          subject: reason ?? "",
          message: reason ? `Problème signalé : ${reason}.` : "",
          category,
          generationId,
          paymentId,
        }}
      />
    </div>
  );
}
