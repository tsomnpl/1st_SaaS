<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

- Local Postgres 16 is already running. Schema push and seed must use `postgresql://flyermint:flyermint@localhost:5432/flyermint`. A hosted `DATABASE_URL` secret must not receive `prisma db push`.
- `npm install` generates the Prisma client. Follow it with `npx prisma db push` and `npm run db:seed` against that local URL. Both are safe to repeat.
- `npm run dev` serves the app on port 3000. `MONEY_FUSION_API_URL` is the dashboard API link; links that already end in `/pay` are posted to directly.
