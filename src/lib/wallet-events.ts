export function publishWalletChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("flyermint:mints"));
  window.dispatchEvent(new Event("flyermint:notices"));
}
