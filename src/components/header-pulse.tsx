"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export type NoticeItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

export type NoticeCounts = {
  total: number;
  history: number;
  admin: number;
};

type Pulse = {
  balance: number | null;
  counts: NoticeCounts;
  items: NoticeItem[];
};

const EMPTY: NoticeCounts = { total: 0, history: 0, admin: 0 };

export function HeaderPulse({
  enabled,
  onPulse,
}: {
  enabled: boolean;
  onPulse: (pulse: Pulse) => void;
}) {
  const pathname = usePathname();
  const search = useSearchParams();
  const searchKey = search.toString();
  const onPulseRef = useRef(onPulse);
  useEffect(() => {
    onPulseRef.current = onPulse;
  }, [onPulse]);

  useEffect(() => {
    if (!enabled) return;
    let stop = false;
    async function load() {
      const [mint, notes] = await Promise.all([
        fetch("/api/mints/balance", { cache: "no-store" })
          .then((response) => response.json())
          .catch(() => null),
        fetch("/api/me/notifications", { cache: "no-store" })
          .then((response) => response.json())
          .catch(() => null),
      ]);
      if (stop) return;
      onPulseRef.current({
        balance: mint?.ok && typeof mint.balance === "number" ? mint.balance : null,
        counts: notes?.ok && notes.counts ? notes.counts : EMPTY,
        items: notes?.ok && Array.isArray(notes.items) ? notes.items : [],
      });
    }
    void load();
    const timer = window.setInterval(() => void load(), 20000);
    window.addEventListener("flyermint:mints", load);
    window.addEventListener("flyermint:notices", load);
    window.addEventListener("focus", load);
    return () => {
      stop = true;
      window.clearInterval(timer);
      window.removeEventListener("flyermint:mints", load);
      window.removeEventListener("flyermint:notices", load);
      window.removeEventListener("focus", load);
    };
  }, [enabled, pathname, searchKey]);

  return null;
}
