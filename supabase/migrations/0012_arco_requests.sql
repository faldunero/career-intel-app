-- =========================================================
-- Ley 21.719 — Panel de solicitudes ARCO+ (Fase 2, Admin)
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> New query
-- =========================================================
--
-- Registro auditable de solicitudes de derechos ARCO+ (Acceso,
-- Rectificación, Cancelación, Oposición, Portabilidad, Bloqueo) que
-- llegan por fuera del autoservicio ya construido (por ejemplo, por
-- correo directo a la empresa, o de un coach/admin/headhunter que no
-- tiene autoservicio como el usuario). La ley exige responder dentro
-- de 30 días — `due_at` se calcula solo al crear la solicitud para
-- que el plazo quede fijo y auditable.

create table public.arco_requests (
  id uuid primary key default gen_random_uuid(),
  request_type text not null check (
    request_type in (
      'acceso',
      'rectificacion',
      'cancelacion',
      'oposicion',
      'portabilidad',
      'bloqueo'
    )
  ),
  requester_name text not null,
  requester_email text not null,
  target_user_id uuid references public.profiles (id) on delete set null,
  description text,
  status text not null default 'pendiente' check (
    status in ('pendiente', 'en_proceso', 'resuelta', 'rechazada')
  ),
  received_at timestamptz not null default now(),
  due_at timestamptz not null default (now() + interval '30 days'),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles (id),
  resolution_notes text,
  created_by uuid references public.profiles (id) not null,
  created_at timestamptz not null default now()
);

alter table public.arco_requests enable row level security;

-- Solo administradores pueden ver y gestionar el panel — es
-- información sensible (quién pidió qué, sobre quién).
create policy "administradores gestionan solicitudes ARCO+"
  on public.arco_requests for all
  using (public.is_admin())
  with check (public.is_admin());
