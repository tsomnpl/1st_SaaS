-- Ajoute les colonnes de description IA (table déjà créée par Isaac, schéma court).
-- Service role uniquement. Ne change pas le caractère privé du bucket.

alter table public.inspiration_source
  add column if not exists analysis jsonb,
  add column if not exists analyzed_at timestamptz;

-- Les descriptions vivent aussi en JSON privé :
--   inspirations-source/_analysis/<id>.json
--   inspirations-source/_analysis/by-domain/<slug>.json
-- Jamais servies via /object/public/.
