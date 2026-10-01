export function serverlessDatabaseUrl(raw: string | undefined, onVercel = false) {
  if (!raw || !onVercel) return raw;
  const queryIndex = raw.indexOf("?");
  const base = queryIndex === -1 ? raw : raw.slice(0, queryIndex);
  const params = new URLSearchParams(queryIndex === -1 ? "" : raw.slice(queryIndex + 1));
  if (!params.has("connection_limit")) params.set("connection_limit", "1");
  if (!params.has("pool_timeout")) params.set("pool_timeout", "20");
  const host = base.match(/@([^/?]+)/)?.[1]?.toLowerCase() ?? "";
  const pooled = host.includes("pooler") || host.includes("pgbouncer");
  if (pooled && !params.has("pgbouncer")) params.set("pgbouncer", "true");
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}
