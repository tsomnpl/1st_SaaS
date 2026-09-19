"use client";

export function AdminUserActions({ userId, status }: { userId: string; status: string }) {
  async function toggle() {
    const next = status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    const reason = window.prompt("Motif", next === "SUSPENDED" ? "Suspension administrative" : "Réactivation") ?? "";
    if (reason.trim().length < 2) return;
    if (!window.confirm(`${next === "SUSPENDED" ? "Suspendre" : "Réactiver"} cet utilisateur ?`)) return;
    await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: userId, status: next, reason }),
    });
    window.location.reload();
  }

  return (
    <button type="button" className="btn-secondary" onClick={toggle}>
      {status === "SUSPENDED" ? "Réactiver" : "Suspendre"}
    </button>
  );
}
