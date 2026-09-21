# Cloud Agent development environment

This project runs in a Cursor Cloud Agent dashboard-managed (DB-managed) environment.
The configuration lives in the Cloud Agent environment settings, not in the repository.
This document describes what that configuration does so it stays reviewable and reproducible.

## What the environment provides

- Node.js toolchain with project dependencies installed (`npm install`).
- Generated Prisma client (`prisma generate`).
- A local PostgreSQL 16 server with a `flyermint` database, schema synced from
  `prisma/schema.prisma`, and reference data seeded from `prisma/seed.mjs`.
- A `next dev` server on port 3000, started on each boot.

## Local database

A local PostgreSQL instance is provisioned so the full, DB-backed app runs without any
external service. The dev role, password, and database are all named `flyermint`, reachable
on `localhost:5432`. The install step exports the matching `DATABASE_URL` for Prisma and
writes it to a minimal `.env` (only when one is not already present), so real secrets
provided through the dashboard always take precedence over the local default.

The `.env` file is intentionally minimal (`DATABASE_URL` + `NEXT_PUBLIC_APP_URL`): copying
`.env.example` verbatim sets `MONEY_FUSION_API_URL=` (empty), which fails the
`z.string().url()` validation in `src/lib/env.ts` and crashes the server.

## Install command (runs once, baked into the build snapshot)

```bash
# System dependency: PostgreSQL (idempotent)
command -v pg_ctlcluster >/dev/null 2>&1 || { sudo apt-get update -qq; sudo apt-get install -y postgresql postgresql-contrib; }

# Ensure the cluster is running so we can provision the dev database
sudo pg_ctlcluster 16 main start 2>/dev/null || true
until pg_isready -h localhost -p 5432 >/dev/null 2>&1; do sleep 1; done

# Provision role and database (idempotent)
sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='flyermint'" | grep -q 1 || sudo -u postgres psql -c "CREATE ROLE flyermint LOGIN PASSWORD 'flyermint';"
sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='flyermint'" | grep -q 1 || sudo -u postgres createdb -O flyermint flyermint

# Local dev env file (only if missing)
[ -f .env ] || printf 'DATABASE_URL=%s\nNEXT_PUBLIC_APP_URL=http://localhost:3000\n' "$LOCAL_DATABASE_URL" > .env

# Application dependencies + Prisma client
npm install
npx prisma generate

# Sync schema + seed reference data
export DATABASE_URL="$LOCAL_DATABASE_URL"
npx prisma db push --skip-generate
npm run db:seed
```

Here `LOCAL_DATABASE_URL` is the local connection string for the `flyermint` role,
password, and database on `localhost:5432` described above.

## Start command (runs on every boot)

```bash
sudo pg_ctlcluster 16 main start 2>/dev/null || true
until pg_isready -h localhost -p 5432 >/dev/null 2>&1; do sleep 1; done
export DATABASE_URL="$LOCAL_DATABASE_URL"
exec npm run dev
```

## Verifying locally

```bash
npm test                     # unit tests
npm run build                # production build
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/pricing   # DB-backed page
```
