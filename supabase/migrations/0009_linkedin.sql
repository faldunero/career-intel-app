-- =========================================================
-- Análisis de LinkedIn (perfil exportado en PDF)
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> New query
-- =========================================================

insert into storage.buckets (id, name, public)
values ('linkedin', 'linkedin', false)
on conflict (id) do nothing;

create policy "usuarios suben su propio PDF de LinkedIn"
  on storage.objects for insert
  with check (
    bucket_id = 'linkedin'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "usuarios leen su propio PDF de LinkedIn"
  on storage.objects for select
  using (
    bucket_id = 'linkedin'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "usuarios borran su propio PDF de LinkedIn"
  on storage.objects for delete
  using (
    bucket_id = 'linkedin'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create table public.linkedin_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  extracted_text text,
  extraction_status text not null default 'pending',
  extraction_error text,
  linkedin_score integer,
  linkedin_analysis jsonb,
  analyzed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.linkedin_profiles enable row level security;

create policy "usuarios ven su propio linkedin_profiles"
  on public.linkedin_profiles for select
  using (auth.uid() = user_id);

create policy "usuarios crean su propio linkedin_profiles"
  on public.linkedin_profiles for insert
  with check (auth.uid() = user_id);

create policy "usuarios actualizan su propio linkedin_profiles"
  on public.linkedin_profiles for update
  using (auth.uid() = user_id);

create policy "usuarios borran su propio linkedin_profiles"
  on public.linkedin_profiles for delete
  using (auth.uid() = user_id);
