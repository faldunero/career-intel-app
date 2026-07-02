# Career Intelligence AI — Fase 0

Esqueleto funcional: Next.js (App Router) + Supabase Auth, con una
página protegida (`/dashboard`) que solo se ve si estás logueado.

## Qué incluye esta fase

- Registro / login con email y password (Supabase Auth)
- Middleware que protege `/dashboard`
- Tabla `profiles` que se crea automáticamente al registrarse (trigger)
- Roles: `usuario`, `coach`, `administrador` (por ahora todos entran como `usuario`)
- RLS activado desde el día 1

## Pasos para levantarlo

### 1. Crear el proyecto en Supabase
1. Ve a https://supabase.com/dashboard y crea un proyecto nuevo.
2. Ve a **Project Settings -> API** y copia:
   - `Project URL`
   - `anon public key`

### 2. Correr la migración SQL
1. En el dashboard de Supabase, abre **SQL Editor -> New query**.
2. Copia y pega el contenido de `supabase/migrations/0001_init.sql`.
3. Ejecuta (Run). Esto crea la tabla `profiles`, el trigger y las políticas RLS.

### 3. Configurar variables de entorno
```bash
cp .env.local.example .env.local
```
Edita `.env.local` y pega tu `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### 4. Instalar dependencias y correr en local
```bash
npm install
npm run dev
```
Abre http://localhost:3000 — debería redirigirte a `/login`.

### 5. Probar el flujo
1. Ve a `/signup`, crea una cuenta.
2. Supabase te manda un correo de confirmación (por defecto, auth con confirmación de email activada).
3. Confirma el correo, vuelve a `/login` e inicia sesión.
4. Deberías llegar a `/dashboard` y ver "Hola, [tu nombre]".

> Tip para probar rápido sin configurar SMTP: en Supabase Dashboard ->
> Authentication -> Providers -> Email, puedes desactivar temporalmente
> "Confirm email" mientras desarrollas en local.

### 6. Subir a GitHub
```bash
git init
git add .
git commit -m "Fase 0: esqueleto Next.js + Supabase Auth"
git branch -M main
git remote add origin <URL_DE_TU_REPO>
git push -u origin main
```

### 7. Deploy en Vercel
1. Ve a https://vercel.com/new e importa el repo de GitHub.
2. En **Environment Variables**, agrega las mismas dos variables de `.env.local`.
3. Deploy. Listo, ya tienes Fase 0 en producción.

## Estructura relevante

```
src/
  app/
    login/page.tsx           -> pantalla de login
    signup/page.tsx           -> pantalla de registro
    dashboard/page.tsx        -> pantalla protegida (server component)
    dashboard/logout-button.tsx
    page.tsx                  -> redirige a /login o /dashboard
  lib/supabase/
    client.ts                 -> cliente para Client Components
    server.ts                 -> cliente para Server Components
  middleware.ts                -> protege /dashboard
supabase/migrations/0001_init.sql  -> tabla profiles + roles + RLS
```

## Proximo paso (Fase 1)
Formulario de perfil profesional: profesion, industria, pais,
seniority, cargo actual/objetivo, modalidad, pretension salarial, etc.
(los campos que pide la Etapa 1 - Descubrimiento del system prompt).
