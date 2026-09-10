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

Remplace `https://TON-DOMAINE` par ton domaine Vercel de production:

- Adresse du site: `https://TON-DOMAINE`
- Return URL: `https://TON-DOMAINE/payment/success`
- Webhook URL: `https://TON-DOMAINE/api/webhooks/moneyfusion`

## References inspiration (PDF)

Pour centraliser tes documents d'inspiration:

1. Cree le dossier `docs/inspirations/`
2. Depose ton fichier `references.pdf` dedans
3. Ajoute si besoin d'autres PDF:
   - `docs/inspirations/les-bases-du-design-by-lpt.pdf`
   - `docs/inspirations/catalogue-affiches.pdf`
