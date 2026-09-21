import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CreateFlyerForm } from "@/components/create-flyer-form";
import { pageTitle } from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import { requireActiveCurrentUser } from "@/server/users";
import { userHasEditableExport } from "@/server/generation";
import { getBrandKit } from "@/server/brand-kit";
import { DOMAINS, FORMATS } from "@/lib/domains";

export const metadata: Metadata = {
  title: pageTitle("Créer une affiche"),
  robots: { index: false, follow: false },
};

export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; format?: string; domain?: string; title?: string }>;
}) {
  let user;
  try {
    user = await requireActiveCurrentUser();
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "UNAUTHORIZED") redirect("/sign-in?redirect_url=/create");
    if (code === "ACCOUNT_SUSPENDED") redirect("/");
    throw error;
  }
  const query = await searchParams;
  const [account, canExport, kit] = await Promise.all([
    prisma.creditAccount.findUnique({ where: { userId: user.id } }).catch(() => null),
    userHasEditableExport(user.id).catch(() => false),
    getBrandKit(user.id),
  ]);
  const balance = account?.balance ?? 0;
  const allowedFormat = FORMATS.some((item) => item.value === query.format) ? query.format : "";
  const allowedDomain = DOMAINS.includes(query.domain as (typeof DOMAINS)[number])
    ? (query.domain as (typeof DOMAINS)[number])
    : undefined;
  const prefilledTitle = (query.title ?? "").slice(0, 80);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Créer une affiche</h1>
        <p className="mt-2 text-slate-600">
          1 Mint = 1 affiche. Direction artistique + personne réelle + contrôle qualité inclus.
        </p>
      </div>
      <CreateFlyerForm
        mintBalance={balance}
        canExport={canExport}
        brandColors={kit?.colors ?? []}
        brandLogoUrl={kit?.logoUrl ?? ""}
        regenerateFromId={query.from ?? ""}
        initialFormat={allowedFormat ?? ""}
        initialDomain={allowedDomain}
        initialTitle={prefilledTitle}
      />
    </div>
  );
}
