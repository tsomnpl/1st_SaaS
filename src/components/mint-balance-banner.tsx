import Link from "next/link";
import { mintBalanceLabel, mintNoun } from "@/lib/mints";

export function MintBalanceBanner({ balance }: { balance: number }) {
  const empty = balance <= 0;

  return (
    <div className="border-t border-violet-100 bg-gradient-to-r from-violet-50 via-white to-emerald-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:py-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6D28D9]">
            Ton solde
          </p>
          <p className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1" aria-live="polite">
            <span className="text-5xl font-extrabold leading-none tracking-tight text-[#1E293B] sm:text-6xl">
              {balance}
            </span>
            <span className="text-lg font-bold text-slate-700 sm:text-2xl">
              {mintNoun(balance)}
            </span>
          </p>
          <p className="mt-2 text-sm font-medium text-slate-600">
            {mintBalanceLabel(balance)}
            <span className="text-slate-400"> · l’export ne consomme rien</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {empty ? (
            <Link href="/pricing" className="btn-primary px-6 py-3 text-base">
              Acheter des Mints
            </Link>
          ) : (
            <>
              <Link href="/create" className="btn-primary px-6 py-3 text-base">
                Créer une affiche
              </Link>
              <Link href="/pricing" className="btn-secondary px-5 py-3">
                Recharger
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
