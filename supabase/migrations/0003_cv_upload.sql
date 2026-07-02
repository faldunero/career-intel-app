-- =========================================================
-- Fase 2: subida de CV (Storage) + tabla cvs + RLS
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> New query
-- =========================================================

-- 1. Bucket privado para los CVs (no público: solo accesible vía API con auth)
insert into storage.buckets (id, name, public)
values ('cvs', 'cvs', false)
on conflict (id) do nothing;

-- 2. Policies del bucket: cada usuario solo puede subir/leer/borrar
--    archivos dentro de su propia carpeta, es decir rutas que empiecen
--    con "{auth.uid()}/...". Ejemplo: "3f2a.../cv-2026-07-02.pdf"
create policy "usuarios suben sus propios CVs"
  on storage.objects for insert
  with check (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "usuarios leen sus propios CVs"
  on storage.objects for select
  using (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "usuarios borran sus propios CVs"
  on storage.objects for delete
  using (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. Tabla `cvs`: registro de cada CV subido + su texto extraído
create table public.cvs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  mime_type text,
  extracted_text text,
  extraction_status text not null default 'pending', -- pending | done | error
  extraction_error text,
  created_at timestamptz not null default now()
);

alter table public.cvs enable row level security;

create policy "usuarios ven sus propios CVs (tabla)"
  on public.cvs for select
  using (auth.uid() = user_id);

create policy "usuarios crean sus propios CVs (tabla)"
  on public.cvs for insert
  with check (auth.uid() = user_id);

create policy "usuarios actualizan sus propios CVs (tabla)"
  on public.cvs for update
  using (auth.uid() = user_id);

create policy "usuarios borran sus propios CVs (tabla)"
  on public.cvs for delete
  using (auth.uid() = user_id);
