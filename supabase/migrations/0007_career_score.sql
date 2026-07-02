-- =========================================================
-- Fase 6: Career Score consolidado
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> New query
-- =========================================================

alter table public.profiles
  add column if not exists career_score integer,
  add column if not exists career_score_analysis jsonb,
  add column if not exists career_score_calculated_at timestamptz;
