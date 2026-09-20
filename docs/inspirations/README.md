Les fichiers d'inspiration servent UNIQUEMENT au moteur interne.

- Ne jamais les afficher sur l'accueil.
- Ne jamais copier une affiche, une mise en page ou un visuel.
- S'en servir pour: hierarchie, contraste, marges, CTA, style par domaine.

Fichiers attendus (non versionnes s'ils sont trop lourds):
- `references.pdf`
- `catalogue-analyse-affiches.docx`
- `bases-du-design-lpt.pdf`

Bibliothèque locale (Pinterest / Behance / portfolios) — **pas des créations FlyerMint** :
- Upload : `scripts/upload-inspirations.py` (voir `UPLOAD-LOCAL.md`)
- Stockage : bucket Supabase privé `inspirations-source`
- Table : `inspiration_source`
- Descriptions IA : `scripts/analyze-inspirations.py` (JSON privé `_analysis/`, jamais public)
- Interdit : afficher, republier, ou servir ces images sur le site.
