# Upload local — bibliothèque d'inspiration (Isaac)

Ces images sont des références collectées en ligne. FlyerMint n'a **aucun droit** dessus.

- Elles ne sont **jamais** affichées sur le site.
- Elles ne sont **jamais** republiees telles quelles.
- Elles ne servent **pas** de fond d'affiche final.
- Elles vont dans un bucket Supabase **prive** `inspirations-source`.

Le cloud agent ne voit pas les fichiers de ton PC Windows. Toi seul executes ce script.

## 1. Une fois dans Supabase (5 minutes)

1. Ouvre le projet Supabase (ou crees-en un).
2. **SQL Editor** → colle et execute `scripts/sql/inspiration_source.sql`.
3. Verifie :
   ```sql
   select id, name, public
   from storage.buckets
   where id = 'inspirations-source';
   ```
   `public` doit etre `false`.
4. **Settings → API** :
   - `Project URL` → `SUPABASE_URL`
   - `service_role` (secret) → `SUPABASE_SERVICE_ROLE_KEY`
   - Ne copie **jamais** `service_role` dans un fichier committe, ni dans un chat public.

Dans `.env.local` a la racine du repo (deja gitignore) :

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## 2. Python sur Windows

Python 3.10+ suffit (aucune dependance pip). Depuis le dossier du repo :

```bat
python scripts\upload-inspirations.py --self-test
```

Doit afficher `self-test OK`.

## 3. Upload (sans compression, sans resize)

Le dossier racine doit contenir les 22 sous-dossiers (Agriculture, Anniversaire, …).

```bat
python scripts\upload-inspirations.py --root "D:\Affiches" --dry-run
```

Si le scan reconnait tes dossiers, enleve `--dry-run` :

```bat
python scripts\upload-inspirations.py --root "D:\Affiches"
```

Le script est **idempotent** : tu peux le relancer. Un fichier deja envoye (meme hash SHA-256 ou meme chemin) est ignore.

Progression : `[12/340] upload agriculture/exemple.jpg`  
Resume final : nombre **upload / skip / fail** par domaine.

Un rapport JSON est ecrit dans `storage/private/inspiration-upload-report.json` (gitignore).

## 4. Quoi renvoyer a l'agent

Colle le resume final, par exemple :

```
Agriculture              12 upload  0 skip  0 fail
...
TOTAL                   340 upload  0 skip  0 fail
```

Sans ce decompte reel, l'agent **ne lance pas** l'analyse visuelle ni le branchement Rodium.

## 5. Ce que l'agent ne fera pas tant que l'upload n'est pas confirme

- Lire `inspiration_source` dans Supabase
- Generer les descriptions IA
- Utiliser ces images comme references de generation
