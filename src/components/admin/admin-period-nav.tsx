import Link from "next/link";

const PERIODS = [
  ["1", "Aujourd’hui"],
  ["7", "7 jours"],
  ["30", "30 jours"],
  ["90", "3 mois"],
  ["365", "12 mois"],
  ["all", "Tout"],
] as const;

export function AdminPeriodNav({
  baseHref,
  current,
}: {
  baseHref: string;
  current: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {PERIODS.map(([value, label]) => (
        <Link
          key={value}
          href={`${baseHref}?period=${value}`}
          className={`rounded-full px-3 py-1 text-sm ${
            current === value ? "bg-[#1E293B] text-white" : "border border-slate-200 bg-white text-slate-600"
          }`}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
