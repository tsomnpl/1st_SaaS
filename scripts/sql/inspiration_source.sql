-- FlyerMint — bibliothèque d'inspiration interne (JAMAIS publique)
-- À exécuter dans l'éditeur SQL du projet Supabase d'Isaac.
-- Service role uniquement. Aucune policy de lecture anon/authenticated.

create extension if not exists pgcrypto;

create table if not exists public.inspiration_source (
  id uuid primary key default gen_random_uuid(),
  domaine text not null,
  folder_name text not null,
  storage_path text not null,
  file_hash text not null,
  original_filename text not null,
  mime_type text,
  byte_size bigint,
  uploaded_at timestamptz not null default now(),
  analysis jsonb,
  analyzed_at timestamptz
);

create unique index if not exists inspiration_source_storage_path_key
  on public.inspiration_source (storage_path);

create unique index if not exists inspiration_source_file_hash_key
  on public.inspiration_source (file_hash);

create index if not exists inspiration_source_domaine_idx
  on public.inspiration_source (domaine);

alter table public.inspiration_source enable row level security;

revoke all on table public.inspiration_source from anon, authenticated, public;
grant all on table public.inspiration_source to service_role;

-- Bucket privé : pas de CDN public, pas d'URL /object/public/...
insert into storage.buckets (id, name, public, file_size_limit)
values ('inspirations-source', 'inspirations-source', false, 83886080)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit;

-- Aucune policy de lecture publique sur ce bucket.
drop policy if exists "inspirations_source_public_read" on storage.objects;
drop policy if exists "Public Access" on storage.objects;

-- Vérifications attendues après exécution :
--   select id, name, public from storage.buckets where id = 'inspirations-source';
--   -> public = false
--   select domaine, count(*) from public.inspiration_source group by 1 order by 1;
