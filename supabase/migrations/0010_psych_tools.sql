-- =========================================================
-- Herramientas psicolaborales (batería propia de Career Intelligence AI)
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> New query
-- =========================================================

-- 1. Asignaciones: el coach habilita una herramienta (o varias, o el
--    set completo) a un usuario. Una fila por (usuario, herramienta).
create table public.psych_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  coach_id uuid not null references public.profiles (id) on delete cascade,
  tool_key text not null check (
    tool_key in ('estilo_laboral', 'rasgos_profesionales', 'razonamiento_logico')
  ),
  status text not null default 'asignado' check (status in ('asignado', 'completado')),
  answers jsonb,
  result jsonb,
  assigned_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, tool_key)
);

-- 2. Comentarios del coach sobre el resultado de una asignación
--    (mismo patrón que cv_comments / linkedin_comments).
create table public.psych_comments (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.psych_assignments (id) on delete cascade,
  coach_id uuid not null references public.profiles (id) on delete cascade,
  comment text not null,
  seen_by_user boolean not null default false,
  created_at timestamptz not null default now()
);

-- 3. Helper security-definer (evita recursión de RLS al validar que el
--    coach que hace la consulta tiene efectivamente a ese usuario
--    asignado). Nombre específico a este feature para no chocar con
--    ningún helper de coach_assignments que ya exista.
create function public.is_coach_of_psych_user(target_user_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.coach_assignments
    where coach_id = auth.uid() and user_id = target_user_id
  );
$$;

-- 4. RLS: psych_assignments
alter table public.psych_assignments enable row level security;

create policy "usuarios ven sus propias asignaciones psicolaborales"
  on public.psych_assignments for select
  using (auth.uid() = user_id);

create policy "usuarios responden sus propias asignaciones"
  on public.psych_assignments for update
  using (auth.uid() = user_id);

create policy "coaches ven las asignaciones de sus usuarios"
  on public.psych_assignments for select
  using (public.is_coach_of_psych_user(user_id));

create policy "coaches asignan herramientas a sus usuarios"
  on public.psych_assignments for insert
  with check (auth.uid() = coach_id and public.is_coach_of_psych_user(user_id));

create policy "coaches actualizan asignaciones de sus usuarios"
  on public.psych_assignments for update
  using (public.is_coach_of_psych_user(user_id));

create policy "coaches eliminan asignaciones no completadas"
  on public.psych_assignments for delete
  using (public.is_coach_of_psych_user(user_id) and status = 'asignado');

create policy "administradores ven todas las asignaciones psicolaborales"
  on public.psych_assignments for select
  using (public.is_admin());

-- 5. RLS: psych_comments
alter table public.psych_comments enable row level security;

create policy "usuarios ven comentarios de sus propias asignaciones"
  on public.psych_comments for select
  using (
    exists (
      select 1 from public.psych_assignments a
      where a.id = assignment_id and a.user_id = auth.uid()
    )
  );

create policy "usuarios marcan como visto sus comentarios"
  on public.psych_comments for update
  using (
    exists (
      select 1 from public.psych_assignments a
      where a.id = assignment_id and a.user_id = auth.uid()
    )
  );

create policy "coaches ven comentarios de sus asignaciones"
  on public.psych_comments for select
  using (
    exists (
      select 1 from public.psych_assignments a
      where a.id = assignment_id and public.is_coach_of_psych_user(a.user_id)
    )
  );

create policy "coaches comentan en sus asignaciones"
  on public.psych_comments for insert
  with check (
    auth.uid() = coach_id
    and exists (
      select 1 from public.psych_assignments a
      where a.id = assignment_id and public.is_coach_of_psych_user(a.user_id)
    )
  );

create policy "administradores ven todos los comentarios psicolaborales"
  on public.psych_comments for select
  using (public.is_admin());
