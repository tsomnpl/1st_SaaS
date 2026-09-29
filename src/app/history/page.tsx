import type { Metadata } from "next";
import Link from "next/link";
import { pageTitle } from "@/lib/seo";
import { getDictionary } from "@/lib/locale";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return {
    title: pageTitle(t.history.title),
    robots: { index: false, follow: false },
  };
}
import { prisma } from "@/lib/prisma";
import { requireActiveCurrentUser } from "@/server/users";
import { ReportProblem } from "@/components/support/report-problem";
import { userHasEditableExport } from "@/server/generation";

export default async function HistoryPage() {
  const { locale, t } = await getDictionary();
  const user = await requireActiveCurrentUser();
  const canExport = await userHasEditableExport(user.id);
  const generations = await prisma.generation.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">{t.history.title}</h1>
          <p className="mt-1 text-slate-600">{t.history.lead}</p>
        </div>
        <Link href="/create" className="btn-primary">
          {t.nav.create}
        </Link>
      </div>

      {generations.length === 0 ? (
        <div className="card p-8 text-center text-slate-500">{t.history.empty}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {generations.map((generation) => {
            const brief = generation.brief as { title?: string; domain?: string };
            return (
              <article key={generation.id} className="card overflow-hidden">
                {generation.outputUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={generation.outputUrl} alt="" className="aspect-[3/4] w-full object-cover" />
                ) : (
                  <div className="flex aspect-[3/4] items-center justify-center bg-slate-50 text-sm text-slate-400">
                    {generation.status === "FAILED" ? t.history.failed : t.history.pending}
                  </div>
                )}
                <div className="space-y-2 p-4">
                  <p className="font-semibold">{brief.title ?? t.history.untitled}</p>
                  <p className="text-xs text-slate-500">
                    {brief.domain ?? "n/a"} · {new Date(generation.createdAt).toLocaleDateString(locale === "en" ? "en-US" : "fr-FR")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {generation.outputUrl ? (
                      <a href={generation.outputUrl} download className="text-sm font-semibold text-[#6D28D9]">
                        {t.history.download}
                      </a>
                    ) : null}
                    {canExport && generation.outputUrl ? (
                      <a
                        href={`/api/generations/${generation.id}/export`}
                        className="text-sm font-semibold text-slate-600"
                      >
                        {t.history.editable}
                      </a>
                    ) : null}
                    {generation.outputUrl ? (
                      <Link
                        href={`/create?from=${generation.id}&format=whatsapp_status`}
                        className="text-sm font-semibold text-slate-600"
                      >
                        {t.history.whatsapp}
                      </Link>
                    ) : null}
                    <ReportProblem generationId={generation.id} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
