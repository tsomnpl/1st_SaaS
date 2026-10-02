import { prisma } from "@/lib/prisma";

export default async function AdminReferralPage() {
  const referrals = await prisma.referral.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      referrer: { select: { id: true, referralCode: true } },
      referred: { select: { id: true } },
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-extrabold">Parrainage</h1>
      <div className="space-y-2">
        {referrals.length === 0 ? <p className="text-sm text-slate-500">Aucun parrainage.</p> : null}
        {referrals.map((referral) => (
          <article key={referral.id} className="admin-card p-4 text-sm">
            <p className="font-semibold">
              {referral.code} · {referral.status}
            </p>
            <p className="text-slate-500">
              Parrain {referral.referrer.id} · invité {referral.referred.id} · bonus{" "}
              {referral.status === "REWARDED" ? "1 Mint chacun" : "0, en attente du pack"} ·{" "}
              {referral.rewardedAt ? referral.rewardedAt.toLocaleString("fr-FR") : "pas encore"}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
