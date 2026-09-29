"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { acknowledgedAlertIds, ADMIN_ALERT_OK_KEY } from "@/lib/admin-alerts";

type Alert = { id: string; text: string; href: string };

export function AdminAlerts({ alerts }: { alerts: Alert[] }) {
  const [hidden, setHidden] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const signature = alerts.map((alert) => alert.id).join("|");

  useEffect(() => {
    let stored: unknown = [];
    try {
      stored = JSON.parse(window.localStorage.getItem(ADMIN_ALERT_OK_KEY) ?? "[]");
    } catch {
      stored = [];
    }
    const next = acknowledgedAlertIds(stored, signature ? signature.split("|") : []);
    window.localStorage.setItem(ADMIN_ALERT_OK_KEY, JSON.stringify(next));
    setHidden(next);
    setReady(true);
  }, [signature]);

  function acknowledge(id: string) {
    const active = signature ? signature.split("|") : [];
    setHidden((current) => {
      const next = acknowledgedAlertIds([...current, id], active);
      window.localStorage.setItem(ADMIN_ALERT_OK_KEY, JSON.stringify(next));
      return next;
    });
  }

  const visible = ready ? alerts.filter((alert) => !hidden.includes(alert.id)) : alerts;
  if (!visible.length) return null;

  return (
    <div className="space-y-2">
      {visible.map((alert) => (
        <div
          key={alert.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
        >
          <Link href={alert.href} className="min-w-0 flex-1">
            {alert.text}
          </Link>
          <button
            type="button"
            className="rounded-lg border border-amber-400 bg-amber-200 px-2.5 py-1 text-xs font-bold text-amber-950"
            onClick={() => acknowledge(alert.id)}
          >
            OK
          </button>
        </div>
      ))}
    </div>
  );
}
