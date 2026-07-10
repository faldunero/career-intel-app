import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtectedRoute = request.nextUrl.pathname.startsWith("/dashboard");
  const isForcePasswordRoute =
    request.nextUrl.pathname === "/force-password-change";
  const isMfaSetupRoute = request.nextUrl.pathname === "/mfa-setup";
  const isMfaChallengeRoute = request.nextUrl.pathname === "/mfa-challenge";
  const isOnboardingRoute =
    isForcePasswordRoute || isMfaSetupRoute || isMfaChallengeRoute;

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && (isProtectedRoute || isOnboardingRoute)) {
    function redirectTo(pathname: string) {
      const url = request.nextUrl.clone();
      url.pathname = pathname;
      return NextResponse.redirect(url);
    }

    // Paso 1: contraseña temporal (cuentas creadas por un admin) —
    // tiene que cambiarla antes de cualquier otra cosa.
    const { data: profile } = await supabase
      .from("profiles")
      .select("must_change_password, skip_mfa")
      .eq("id", user.id)
      .single();

    if (profile?.must_change_password && !isForcePasswordRoute) {
      return redirectTo("/force-password-change");
    }
    if (!profile?.must_change_password && isForcePasswordRoute) {
      return redirectTo("/mfa-setup");
    }

    // Si skip_mfa es true (usuarios QA), saltar todas las validaciones de MFA
    if (profile?.skip_mfa) {
      return supabaseResponse;
    }

    // Paso 2: 2FA obligatorio para todas las cuentas — si todavía no
    // tiene ningún factor verificado, lo mandamos a configurarlo.
    //
    // Nota: NO usamos "nextLevel" de getAuthenticatorAssuranceLevel() ni
    // "user.factors" de getUser() — confirmamos con debug que ninguno
    // de los dos viene poblado de forma confiable en este contexto.
    // listFactors() es la función dedicada de Supabase para esto y sí
    // funciona.
    const { data: factorsData } = await supabase.auth.mfa.listFactors();
    const hasVerifiedTotp =
      factorsData?.totp?.some((f) => f.status === "verified") ?? false;

    if (
      !profile?.must_change_password &&
      !hasVerifiedTotp &&
      !isMfaSetupRoute
    ) {
      return redirectTo("/mfa-setup");
    }
    if (hasVerifiedTotp && isMfaSetupRoute) {
      return redirectTo("/dashboard");
    }

    // Paso 3: ya tiene 2FA activo — si esta sesión concreta todavía no
    // pasó el desafío (por ejemplo, sesión nueva recién logueada), se
    // le pide el código antes de dejarlo entrar.
    const { data: aal } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    const needsMfaChallenge = hasVerifiedTotp && aal?.currentLevel !== "aal2";

    if (needsMfaChallenge && !isMfaChallengeRoute) {
      return redirectTo("/mfa-challenge");
    }
    if (!needsMfaChallenge && isMfaChallengeRoute) {
      return redirectTo("/dashboard");
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
