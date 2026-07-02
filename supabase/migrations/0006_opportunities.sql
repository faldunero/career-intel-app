-- =========================================================
-- Fase 5: CRM de Oportunidades
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> New query
-- =========================================================

create type public.opportunity_status as enum (
  'por_postular',
  'postulado',
  'entrevista',
  'oferta',
  'rechazado',
  'abandonado'
);

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  job_match_id uuid references public.job_matches (id) on delete set null,
  company text,
  job_title text,
  industry text,
  source text,
  url text,
  recruiter_name text,
  recruiter_contact text,
  status public.opportunity_status not null default 'por_postular',
  published_at date,
  applied_at date,
  last_contact_at date,
  next_action text,
  next_action_date date,
  result text,
  priority text,
  notes text,
  success_probability integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.opportunities enable row level security;

create policy "usuarios ven sus propias oportunidades"
  on public.opportunities for select
  using (auth.uid() = user_id);

create policy "usuarios crean sus propias oportunidades"
  on public.opportunities for insert
  with check (auth.uid() = user_id);

create policy "usuarios actualizan sus propias oportunidades"
  on public.opportunities for update
  using (auth.uid() = user_id);

create policy "usuarios borran sus propias oportunidades"
  on public.opportunities for delete
  using (auth.uid() = user_id);
