-- =========================================================
-- Fase 4: matching de vacantes (IA vía Groq)
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> New query
-- =========================================================

create table public.job_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  cv_id uuid references public.cvs (id) on delete set null,
  job_title text,
  company text,
  job_description text not null,
  matching_general integer,
  matching_ats integer,
  matching_tecnico integer,
  matching_liderazgo integer,
  matching_cultural integer,
  matching_experiencia integer,
  analysis jsonb,
  created_at timestamptz not null default now()
);

alter table public.job_matches enable row level security;

create policy "usuarios ven sus propios matches"
  on public.job_matches for select
  using (auth.uid() = user_id);

create policy "usuarios crean sus propios matches"
  on public.job_matches for insert
  with check (auth.uid() = user_id);

create policy "usuarios borran sus propios matches"
  on public.job_matches for delete
  using (auth.uid() = user_id);
