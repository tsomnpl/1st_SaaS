"use client";

import { useState } from "react";
import Link from "next/link";
import { REPORT_REASONS } from "@/lib/support";

export function ReportProblem({ generationId }: { generationId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="text-sm">
      <button type="button" className="font-semibold text-slate-600" onClick={() => setOpen((value) => !value)}>
        Signaler un problème
      </button>
      {open ? (
        <ul className="mt-2 space-y-1">
          {REPORT_REASONS.map((reason) => (
            <li key={reason.id}>
              <Link className="text-[#6D28D9]" href={`/support/nouveau?generation=${generationId}&motif=${reason.id}`}>
                {reason.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
