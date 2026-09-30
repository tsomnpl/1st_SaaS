"use client";

import { useEffect, useState } from "react";

function formatLeft(endsAt: string, doneLabel: string) {
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return doneLabel;
  const total = Math.floor(ms / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return `${days}j ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}min ${String(seconds).padStart(2, "0")}s`;
}

export function OfferCountdown({
  endsAt,
  prefix,
  doneLabel,
}: {
  endsAt: string;
  prefix: string;
  doneLabel: string;
}) {
  const [text, setText] = useState(() => formatLeft(endsAt, doneLabel));

  useEffect(() => {
    const timer = window.setInterval(() => setText(formatLeft(endsAt, doneLabel)), 1000);
    return () => window.clearInterval(timer);
  }, [doneLabel, endsAt]);

  return (
    <p className="mt-3 rounded-xl bg-[#F5F3FF] px-3 py-2 text-sm font-semibold text-[#6D28D9]">
      {prefix} {text}
    </p>
  );
}
