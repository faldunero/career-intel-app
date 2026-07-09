-- =========================================================
-- Ley 21.719 — consentimiento en la solicitud de acceso headhunter
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> New query
-- =========================================================
--
-- El formulario público /solicitar-acceso-headhunter recolectaba
-- datos personales (nombre, correo, empresa, teléfono) sin ningún
-- aviso de privacidad ni registro de consentimiento. Esta columna
-- guarda la evidencia (fecha/hora) de que quien solicitó aceptó la
-- Política de Privacidad antes de enviar sus datos.

alter table public.headhunter_requests
  add column if not exists consent_accepted_at timestamptz;
