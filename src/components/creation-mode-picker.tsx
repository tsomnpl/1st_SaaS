import Link from "next/link";
import { CREATION_MODES, type CreationModeId } from "@/lib/creation-modes";

export function CreationModePicker({
  canUsePersonalReference,
  onSelect,
}: {
  canUsePersonalReference: boolean;
  onSelect: (mode: CreationModeId) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">Comment voulez-vous créer votre affiche ?</h2>
        <p className="mt-2 text-sm text-slate-600">
          Le moteur FlyerMint reste le même pour tous les packs : brief, références internes, direction artistique,
          génération et contrôle qualité. Choisissez simplement le point de départ.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {CREATION_MODES.map((mode) => {
          const locked = mode.premium && !canUsePersonalReference;
          return (
            <article
              key={mode.id}
              className={`relative flex flex-col rounded-2xl border p-4 text-left ${
                locked ? "border-slate-200 bg-slate-50" : "border-slate-200 bg-white hover:border-violet-300"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Mode {mode.number}</p>
                {mode.premium ? (
                  <span className="rounded-full bg-[#6D28D9] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    PRO — 20k / 25k
                  </span>
                ) : null}
              </div>
              <h3 className="mt-2 text-lg font-bold text-[#1E293B]">{mode.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{mode.description}</p>
              <ul className="mt-3 space-y-1 text-xs text-slate-500">
                {mode.examples.slice(0, 2).map((example) => (
                  <li key={example}>· {example}</li>
                ))}
              </ul>
              {locked ? (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-slate-700">
                    Cette création avancée est disponible avec les packs 20 000 FCFA et 25 000 FCFA.
                  </p>
                  <Link href="/pricing" className="btn-primary w-full">
                    Débloquer la création avancée
                  </Link>
                </div>
              ) : (
                <button type="button" className="btn-primary mt-4" onClick={() => onSelect(mode.id)}>
                  Choisir ce mode
                </button>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
