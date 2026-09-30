"use client";

import { useEffect, useState } from "react";

export function LiveMintLine({ initial }: { initial: number }) {
  const [balance, setBalance] = useState(initial);

  useEffect(() => {
    const load = () => {
      fetch("/api/mints/balance", { cache: "no-store" })
        .then((response) => response.json())
        .then((data: { ok?: boolean; balance?: number }) => {
          if (data.ok && typeof data.balance === "number") setBalance(data.balance);
        })
        .catch(() => undefined);
    };
    window.addEventListener("flyermint:mints", load);
    return () => window.removeEventListener("flyermint:mints", load);
  }, []);

  return (
    <span className="font-semibold text-[#6D28D9]">
      {balance} Mint{balance > 1 ? "s" : ""}
    </span>
  );
}
