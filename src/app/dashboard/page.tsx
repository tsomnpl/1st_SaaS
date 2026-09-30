import type { Metadata } from "next";
import Link from "next/link";
import { pageTitle } from "@/lib/seo";
import { getDictionary } from "@/lib/locale";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return {
    title: pageTitle(t.nav.dashboard),
    robots: { index: false, follow: false },
  };
}
import { ReferralCard } from "@/components/referral-card";
import { prisma } from "@/lib/prisma";
import { requireActiveCurrentUser } from "@/server/users";

export default async function DashboardPage() {
  const { t } = await getDictionary();
  const user = await requireActiveCurrentUser();
  const [account, lastGenerations, referrals] = await Promise.all([
    prisma.creditAccount.findUnique({ where: { userId: user.id } }),
    prisma.generation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.referral.findMany({
      where: { referrerUserId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, status: true, rewardedAt: true },
    }).catch(() => []),
  ]);

  const balance = account?.balance ?? 0;
  return (
    <div className="space-y-6">
      <section className="card flex flex-col justify-between gap-6 p-6 md:flex-row md:items-center">
        <div>
          <p className="text-sm text-slate-500">{t.dashboard.yours}</p>
          <h1 className="mt-1 text-3xl font-extrabold text-[#1E293B]">
            {balance} {balance > 1 ? t.dashboard.leftMany : t.dashboard.leftOne}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{t.dashboard.note}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/create" className="btn-primary">
            {t.nav.create}
          </Link>
          <Link href="/pricing" className="btn-secondary">
            {t.nav.buyMints}
          </Link>
        </div>
      </section>

      <section className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{t.dashboard.latest}</h2>
          <Link href="/history" className="text-sm font-semibold text-[#6D28D9]">
            {t.nav.history}
          </Link>
        </div>
        <div className="mt-4 space-y-2 text-sm">
          {lastGenerations.length === 0 ? <p className="text-slate-500">{t.dashboard.empty}</p> : null}
          {lastGenerations.map((generation) => (
            <div key={generation.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
              <span>{String((generation.brief as { title?: string })?.title ?? t.dashboard.untitled)}</span>
              <span className="text-slate-500">{statusLabel(generation.status, t)}</span>
            </div>
          ))}
        </div>
      </section>

      {user.referralCode ? (
        <ReferralCard
          code={user.referralCode}
          invited={referrals.length}
          rewarded={referrals.filter((row) => row.status === "REWARDED").length}
          rows={referrals.map((row) => ({
            id: row.id,
            status: row.status,
            rewardedAt: row.rewardedAt ? row.rewardedAt.toISOString() : null,
          }))}
        />
      ) : null}
    </div>
  );
}

function statusLabel(status: string, t: Awaited<ReturnType<typeof getDictionary>>["t"]) {
  if (status === "COMPLETED") return t.dashboard.ready;
  if (status === "FAILED") return t.dashboard.failed;
  return t.dashboard.pending;
}
