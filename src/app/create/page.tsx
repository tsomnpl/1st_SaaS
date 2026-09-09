import { CreateFlyerForm } from "@/components/create-flyer-form";
import { getOrCreateCurrentUser } from "@/server/users";
import { prisma } from "@/lib/prisma";

export default async function CreatePage() {
  const user = await getOrCreateCurrentUser();
  const account = await prisma.creditAccount.findUnique({ where: { userId: user.id } });
  const balance = account?.balance ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Creer une affiche</h1>
      <p className="text-white/80">
        Solde: <span className="font-semibold text-emerald-300">{balance} Mints</span>.
      </p>
      <CreateFlyerForm />
    </div>
  );
}
