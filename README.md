## FlyerMint

SaaS de création d’affiches professionnelles avec IA.

Positionnement : ton directeur artistique, pas un générateur brut.

### Stack

Next.js 16 · TypeScript · Tailwind · Clerk · Prisma · PostgreSQL · Zod

### Setup

```bash
npm install
cp .env.example .env
npm run prisma:generate
npx prisma migrate deploy
npm run db:seed
npm run dev
```

### Règles métier

- 1 Mint = 1 affiche
- 1 Mint offert à l’inscription
- L’export ne consomme aucun Mint
- `/payment/success` ne crédite jamais les Mints
- Le webhook Money Fusion public : `/api/webhooks/moneyfusion`

### Money Fusion

Return URL unique : `{NEXT_PUBLIC_APP_URL}/payment/success`  
Webhook : `{NEXT_PUBLIC_APP_URL}/api/webhooks/moneyfusion`

Ne renseigne ces URLs dans Money Fusion qu’après un webhook qui crédite réellement.

Les références visuelles restent internes. Elles nourrissent la composition, jamais une copie d’affiche.
