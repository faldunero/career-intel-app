-- =========================================================
-- Carta de presentación por vacante
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> New query
-- =========================================================

alter table public.job_matches
  add column if not exists cover_letter text;
