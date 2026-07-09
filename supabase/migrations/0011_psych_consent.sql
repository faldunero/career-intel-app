-- =========================================================
-- Ley 21.719 — consentimiento específico para Psicolaboral
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> New query
-- =========================================================
--
-- Las herramientas psicolaborales tocan datos de personalidad —una
-- categoría más sensible que el resto del producto (CV, matching,
-- etc., que se cubren con el consentimiento general de la Política de
-- Privacidad aceptado al registrarse). Por eso llevan su propio
-- consentimiento específico, informado y con registro de fecha/hora
-- (evidencia operativa que exige la ley), independiente del general.

alter table public.profiles
  add column if not exists psych_consent_at timestamptz;
