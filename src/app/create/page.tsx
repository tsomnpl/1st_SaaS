import type { Metadata } from "next";
import { CreateFlyerForm } from "@/components/create-flyer-form";
import { pageTitle } from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import { requireActiveCurrentUser } from "@/server/users";
import { userHasEditableExport } from "@/server/generation";
import { getBrandKit } from "@/server/brand-kit";
import { FORMATS } from "@/lib/domains";

export const metadata: Metadata = {
  title: pageTitle("Créer une affiche"),
  robots: { index: false, follow: false },
};

export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; format?: string }>;
}) {
  const user = await requireActiveCurrentUser();
  const query = await searchParams;
  const account = await prisma.creditAccount.findUnique({ where: { userId: user.id } });
  const balance = account?.balance ?? 0;
  const canExport = await userHasEditableExport(user.id);
  const kit = await getBrandKit(user.id);
  const allowedFormat = FORMATS.some((item) => item.value === query.format) ? query.format : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Créer une affiche</h1>
        <p className="mt-2 text-slate-600">
          Solde : <span className="font-semibold text-[#6D28D9]">{balance} Mint{balance > 1 ? "s" : ""}</span>
          . 1 Mint = 1 affiche. Direction artistique + personne réelle + contrôle qualité inclus.
        </p>
      </div>
      <CreateFlyerForm
        mintBalance={balance}
        canExport={canExport}
        brandColors={kit?.colors ?? []}
        brandLogoUrl={kit?.logoUrl ?? ""}
        regenerateFromId={query.from ?? ""}
        initialFormat={allowedFormat ?? ""}
      />
    </div>
  );
}
