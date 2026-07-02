-- =========================================================
-- Fase 1: campos de perfil profesional (Etapa 1 - Descubrimiento)
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> New query
-- =========================================================

alter table public.profiles
  add column if not exists country text,
  add column if not exists city text,
  add column if not exists profession text,
  add column if not exists specialty text,
  add column if not exists industry text,
  add column if not exists years_experience integer,
  add column if not exists seniority text,
  add column if not exists current_position text,
  add column if not exists target_role text,
  add column if not exists work_mode text,
  add column if not exists target_companies text,
  add column if not exists salary_expectation text,
  add column if not exists languages text,
  add column if not exists certifications text,
  add column if not exists strengths text,
  add column if not exists weaknesses text,
  add column if not exists motivations text,
  add column if not exists restrictions text,
  add column if not exists profile_completed boolean not null default false;

-- Nota: no fue necesario tocar las policies de RLS de la Fase 0.
-- "usuarios actualizan su propio perfil" ya cubre estas columnas nuevas,
-- porque la policy aplica a la fila completa (auth.uid() = id),
-- no a columnas específicas.
