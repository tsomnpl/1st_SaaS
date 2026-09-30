import { PromoManager } from "@/components/admin/promo-manager";
import { prisma } from "@/lib/prisma";

export default async function AdminPromoPage() {
  const codes = await prisma.promoCode.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-extrabold">Codes promo</h1>
        <p className="mt-2 text-sm text-slate-500">
          Un code donne un nombre de Mints aux premières personnes qui le saisissent sur la page Tarifs. Tu peux le
          supprimer ensuite. Les Mints déjà ajoutés restent sur le compte.
        </p>
      </div>
      <PromoManager
        initial={codes.map((row) => ({
          id: row.id,
          code: row.code,
          mintAmount: row.mintAmount,
          maxUses: row.maxUses,
          usedCount: row.usedCount,
          active: row.active,
        }))}
      />
    </div>
  );
}
