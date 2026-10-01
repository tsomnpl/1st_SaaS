"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#f7f8fb", color: "#1e293b", fontFamily: "Arial, sans-serif" }}>
        <div style={{ maxWidth: "28rem", padding: "1.5rem" }}>
          <h1 style={{ fontSize: "1.5rem", margin: "0 0 0.75rem" }}>Cette page n’a pas pu s’ouvrir</h1>
          <p style={{ margin: "0 0 1rem", lineHeight: 1.5 }}>Le chargement a échoué. Réessaie, ou reviens à l’accueil.</p>
          <button type="button" onClick={() => reset()} style={{ marginRight: "0.75rem", background: "#6d28d9", color: "#fff", border: 0, borderRadius: "8px", padding: "0.7rem 1rem", fontWeight: 700 }}>
            Réessayer
          </button>
          <a href="/" style={{ color: "#6d28d9", fontWeight: 700 }}>Accueil</a>
        </div>
      </body>
    </html>
  );
}
