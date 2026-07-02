-- =========================================================
-- Fase 0: tabla profiles + roles + trigger + RLS
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> New query
-- =========================================================

-- 1. Tipo de rol (usuario / coach / administrador, según el system prompt)
create type public.user_role as enum ('usuario', 'coach', 'administrador');

-- 2. Tabla profiles: extiende auth.users con datos propios de la app
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role public.user_role not null default 'usuario',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Trigger: cuando alguien se registra en auth.users,
--    se crea automáticamente su fila en profiles
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Row Level Security
alter table public.profiles enable row level security;

-- Un usuario puede ver su propia fila
create policy "usuarios ven su propio perfil"
  on public.profiles for select
  using (auth.uid() = id);

-- Un usuario puede actualizar su propia fila
create policy "usuarios actualizan su propio perfil"
  on public.profiles for update
  using (auth.uid() = id);

-- Función auxiliar (security definer) para evitar recursión infinita
-- al consultar el rol dentro de una policy de la propia tabla profiles
create function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'administrador'
  );
$$;

-- Los administradores ven todos los perfiles
create policy "administradores ven todos los perfiles"
  on public.profiles for select
  using (public.is_admin());

-- Nota: la política de "coach ve solo usuarios asignados" se agrega
-- en una fase posterior, cuando exista la tabla coach_assignments.
