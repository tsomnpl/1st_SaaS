Les fichiers d'inspiration servent au moteur interne, jamais d'affichage brut.

- `catalogue-analyse-affiches.pdf` : structure des 27 fiches (déjà extraite).
- `references.pdf` : **référence de STYLE uniquement**. Une page peut être envoyée à Gemini (image-to-image) pour composition/palette. Jamais extraite pour être affichée sur le site. Jamais de logo ou nom de marque réelle recopié.
- `bases-du-design-lpt.pdf` : **absent du git**. Les règles sont dans `src/lib/design-rules.ts`.

Les extraits de pages vivent dans `storage/private/ref-pages/` (gitignore). Les visuels publics sont uniquement les générations IA.
