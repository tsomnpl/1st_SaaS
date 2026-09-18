import type { Metadata } from "next";
import { CreateFlyerForm } from "@/components/create-flyer-form";
import { pageTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: pageTitle("Créer une affiche"),
  robots: { index: false, follow: false },
};
import { prisma } from "@/lib/prisma";
import { requireActiveCurrentUser } from "@/server/users";
import { userHasEditableExport } from "@/server/generation";

export default async function CreatePage() {
  const user = await requireActiveCurrentUser();
  const account = await prisma.creditAccount.findUnique({ where: { userId: user.id } });
  const balance = account?.balance ?? 0;
  const canExport = await userHasEditableExport(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Créer une affiche</h1>
        <p className="mt-2 text-slate-600">
          Solde : <span className="font-semibold text-[#6D28D9]">{balance} Mint{balance > 1 ? "s" : ""}</span>
          . 1 Mint = 1 affiche.
        </p>
      </div>
      <CreateFlyerForm mintBalance={balance} canExport={canExport} />
    </div>
  );
}
