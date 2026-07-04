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
  const isMfaChallengeRoute = request.nextUrl.pathname === "/mfa-challenge";

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Si el usuario tiene 2FA activado pero todavía no completó el
  // segundo factor en esta sesión, lo mandamos a verificarlo antes de
  // dejarlo entrar a cualquier página protegida.
  //
  // Nota: NO usamos "nextLevel" de getAuthenticatorAssuranceLevel() ni
  // "user.factors" de getUser() — confirmamos con debug que ninguno
  // de los dos viene poblado de forma confiable en este contexto.
  // listFactors() es la función dedicada de Supabase para esto y sí
  // funciona.
  if (user && (isProtectedRoute || isMfaChallengeRoute)) {
    const { data: factorsData } = await supabase.auth.mfa.listFactors();
    const hasVerifiedTotp =
      factorsData?.totp?.some((f) => f.status === "verified") ?? false;

    const { data: aal } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    const needsMfa = hasVerifiedTotp && aal?.currentLevel !== "aal2";

    if (needsMfa && !isMfaChallengeRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/mfa-challenge";
      return NextResponse.redirect(url);
    }

    if (!needsMfa && isMfaChallengeRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
