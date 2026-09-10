## FlyerMint MVP

FlyerMint est un SaaS de creation d'affiches professionnelles avec IA.

Positionnement: **ton directeur artistique IA**, pas juste un generateur d'images.

### Atouts differenciateurs integres

- Questionnaire intelligent par domaine (questions adaptatives)
- Rule engine business: `1 Mint = 1 affiche`
- Ledger complet des Mints (FREE_GRANT, PURCHASE, GENERATION, REFUND, etc.)
- Consommation FEFO (mints expirant bientot consommes d'abord)
- Paiement Money Fusion avec idempotence webhook
- Pipeline interne: brief -> art direction -> prompt -> generation -> quality score
- Monitoring cout RODI (objectif 10-20 par affiche)
- Base Admin separee et protegee cote serveur

## Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Clerk
- Prisma + PostgreSQL
- Zod

## Setup

1) Installer les dependances

```bash
npm install
```

2) Configurer les variables:

```bash
cp .env.example .env
```

3) Migrer la base:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
```

4) Lancer:

```bash
npm run dev
```

## Notes importantes

- Ne jamais exposer de secret dans le frontend ou les logs.
- `/payment/success` n'accorde jamais des Mints sans verification serveur.
- Les endpoints admin exigent un role admin cote serveur.
- Webhook Money Fusion public recommande: `/api/webhooks/moneyfusion`.

## Money Fusion (URLs a configurer)

Domaine de production actuel:

- Adresse du site: `https://flyermint-t.vercel.app`
- Return URL: `https://flyermint-t.vercel.app/payment/success`
- Webhook URL: `https://flyermint-t.vercel.app/api/webhooks/moneyfusion`

Dans Vercel, `NEXT_PUBLIC_APP_URL` et `MONEY_FUSION_WEBHOOK_URL` doivent pointer vers ces URLs.

Les references (PDF / catalogue) restent internes. Elles nourrissent les principes de composition, jamais une copie d'affiche pour le client.
