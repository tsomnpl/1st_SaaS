# AUDIT INITIAL

Date audit: 2026-09-10  
Repo: `c:/Users/ddtch/OneDrive/Desktop/FlyerMint`

## 1) Etat Git reel (preuves)

Commande executee:

```bash
git rev-parse --abbrev-ref HEAD; git log origin/master -1 --oneline; git status --short
```

Sortie reelle:

```text
master
75d2ffd feat: harden webhook/admin and add Rodium smart model routing
```

Conclusion:
- Branche courante: `master`
- Dernier commit distant constate sur `origin/master`: `75d2ffd`
- `git status --short` ne retourne aucune ligne: working tree propre.

## 2) Verification demarrage local (preuves)

Commande executee:

```bash
npm run dev
```

Sortie reelle:

```text
npm warn Unknown env config "devdir". This will stop working in the next major version of npm. See `npm help npmrc` for supported config options.

> flyermint@0.1.0 dev
> next dev

'next' n'est pas reconnu en tant que commande interne
ou externe, un programme executable ou un fichier de commandes.
```

Conclusion:
- Demarrage local KO.
- Cause immediate: dependances locales non resolues (`next` introuvable dans l'environnement local execute ici).

## 3) Verification build production (preuves)

Commande executee:

```bash
npm run build
```

Sortie reelle:

```text
npm warn Unknown env config "devdir". This will stop working in the next major version of npm. See `npm help npmrc` for supported config options.

> flyermint@0.1.0 build
> next build

'next' n'est pas reconnu en tant que commande interne
ou externe, un programme executable ou un fichier de commandes.
```

Conclusion:
- Build local non verifie.
- Blocage environnement local tant que les binaires npm du projet ne sont pas executables ici.

## 4) Verification URL deploiement (preuves)

URLs testees:
- `https://flyermint-t-git-master-tsomnpls-projects.vercel.app`
- `https://flyermint-t-git-master-tsomnpls-projects.vercel.app/payment/success`
- `https://flyermint-t-git-master-tsomnpls-projects.vercel.app/api/webhooks/moneyfusion`

Resultat HTTP reel via fetch:
- 403 Forbidden sur les 3 URLs.

Verification navigateur automatisee:
- URL finale ouverte: `https://vercel.com/login?...`
- Titre page: `Login – Vercel`

Conclusion:
- Le deploiement est protege (SSO/login Vercel) depuis l'environnement de test automatise utilise ici.
- Parcours utilisateur public non testable tant que cette barriere reste active pour cet environnement.

## CE QUI FONCTIONNE VRAIMENT (avec preuve)

- Le repo distant est bien sur `master` avec commit `75d2ffd` (preuve section 1).
- Le code contient les routes critiques attendues (inspection statique):
  - webhook public dedie: `src/app/api/webhooks/moneyfusion/route.ts`
  - verification paiement: `src/app/api/payments/verify/[token]/route.ts`
  - retour paiement: `src/app/payment/success/page.tsx`
  - admin privee: `src/app/[adminPrivatePath]/...`
  - neutralisation de `/admin` + protection dans `src/proxy.ts`.

## CE QUI EST INCOMPLET

- Preuves d'execution E2E utilisateurs (boutons/liens) non obtenues.
- Tests reels Money Fusion (succes/echec/double webhook) non executes contre un environnement testable.
- Tests reels Clerk avec 3 profils (non connecte/user/admin) non executes en session live.
- Sortie `RODIUM /v1/models` et `RODIUM /v1/pricing` non fournie.

## CE QUI EST CASSE (avec message d'erreur exact)

- Local dev casse:
  - `'next' n'est pas reconnu en tant que commande interne...`
- Local build casse:
  - `'next' n'est pas reconnu en tant que commande interne...`
- URLs deploiement testees depuis cet environnement:
  - `403 Forbidden`.

## CE QUI DOIT ETRE REFACTORE

- Idempotence webhook: renforcer la garantie en concurrence (verrou/contrainte metier stricte pour interdire double credit simultane).
- Admin: structure complete demandee (sidebar + modules Users/Payments/Mints/Generations/Analytics/Logs/Settings) encore partielle.
- Landing: sections visuelles premium encore inachevees (showcase affiches reelles, avant/apres, galerie riche, footer complet, etc.).

## CE QUI DOIT ETRE SUPPRIME

- Aucun element critique a supprimer immediatement valide par preuve runtime.
- A reevaluer apres execution E2E reelle quand l'app sera accessible aux tests.

## CE QUI MANQUE

- Environnement local executable pour tests automatises (`npm run dev/build/test/lint`).
- Accessibilite HTTP publique testable du deploiement (sans redirection SSO Vercel pour les robots de test).
- PDFs de references reels dans `docs/inspirations/` (ex: `references.pdf`, `bases-du-design-lpt.pdf`).

## CE QUI BLOQUE

### Deploiement
- Bloque pour audit externe automatise par protection 403/login Vercel.

### Paiements
- Non verifies en bout-en-bout (pas de simulation webhook live observable ici).

### Generation IA
- Non verifiee en runtime local (serveur local non demarrable dans cet environnement).

### Administration
- Non verifiee en 3 profils reels faute de session testable ici.

## CE QUI EST FAUSSEMENT ANNONCE COMME "FAIT"

- "Tous les boutons marchent": non prouve et non verifie en test reel ici.
- "Build local passe": faux dans cet environnement (preuve section 3).
- "URLs deployees fonctionnelles publiquement": non verifiees ici (403 observe, section 4).

## TEST BOUTONS/LIENS (STATUT PREUVE)

Regle appliquee: si non teste reellement, marque "Non verifie".

- Creer une affiche: Non verifie (app inaccessible en test deploye + dev local KO)
- Connexion / Inscription / Deconnexion: Non verifie
- Tarifs / Acheter (2k, 5k, 10k, 15k, 20k, 25k): Non verifie
- Generer: Non verifie
- Telecharger / Exporter: Non verifie
- Historique / Profil: Non verifie
- Menu mobile / cartes galerie / footer: Non verifie

## CONFIGURATIONS BLOQUANTES

PROBLEME: impossible de lancer les tests fonctionnels complets dans cet environnement d'audit.  
CAUSE: `next` non executable localement + URLs deploiement en 403/login Vercel cote robot.  
TESTS DEJA EFFECTUES: `npm run dev`, `npm run build`, appels HTTP deployes, snapshot navigateur deploye.  
CE QUI MANQUE: environnement runnable (local ou deploye public testable) + credentials de test si necessaire.  
ACTION QUE JE DOIS FAIRE MOI-MEME: fournir un acces de test exploitable (ou domaine public sans blocage) pour permettre la preuve E2E complete bouton par bouton.

## PASSAGE VISUEL (10 sept 2026, apres feu vert)

Travail code (pas encore prouve en runtime local) :
- Accueil reconstruit : hero visuel, posters CSS, avant/apres, questionnaire, tarifs, footer.
- Jargon interne retire de l'accueil (pas d'inspirations, pas de webhook, pas de RODI, pas de ledger).
- Inspirations restent uniquement cote generation (`src/lib/inspiration.ts`) pour le choix IA.
- Navbar glass + menu mobile (burger).
- Page tarifs alignee visuellement.
- Resultat creation : plus d'affichage RODI/modele cote utilisateur.
- Webhooks additionnels prix/admin : non crees, en attente de ta spec.

Preuve runtime de ce passage : **Non verifie** — `npm install` local encore en cours / `next` n'etait pas executable au moment de l'audit.
