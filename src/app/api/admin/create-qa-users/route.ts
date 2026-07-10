import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-guard";

export const runtime = "nodejs";

const QA_USERS = [
  {
    email: "coach_qa@example.com",
    password: "QA1234",
    fullName: "Coach QA",
    role: "coach",
  },
  {
    email: "user_qa@example.com",
    password: "QA1234",
    fullName: "User QA",
    role: "usuario",
  },
  {
    email: "headhunter_qa@example.com",
    password: "QA1234",
    fullName: "Headhunter QA",
    role: "headhunter",
  },
];

export async function POST(request: Request) {
  const check = await requireAdmin({ requireSuperAdmin: true });
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  const admin = createAdminClient();
  const results = [];
  const errors = [];

  for (const user of QA_USERS) {
    try {
      // 1. Crear usuario en auth.users
      const { data: authUser, error: authError } = await admin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Skip email confirmation
        user_metadata: {
          skip_mfa: true, // Mark to skip MFA
        },
      });

      if (authError || !authUser) {
        errors.push({
          email: user.email,
          error: authError?.message || "Error creating auth user",
        });
        continue;
      }

      // 2. Crear perfil en profiles
      const { error: profileError } = await admin
        .from("profiles")
        .insert({
          id: authUser.user.id,
          full_name: user.fullName,
          role: user.role,
          email: user.email,
          is_test_data: true,
          visible_to_headhunters: user.role === "usuario" ? true : false,
          skip_mfa: true, // Saltar MFA para usuarios QA
          must_change_password: false, // No requiere cambiar password
        });

      if (profileError) {
        errors.push({
          email: user.email,
          error: profileError.message || "Error creating profile",
        });
        continue;
      }

      results.push({
        email: user.email,
        userId: authUser.user.id,
        role: user.role,
        status: "✅ Creado",
      });
    } catch (err) {
      errors.push({
        email: user.email,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({
    ok: true,
    message: `${results.length}/${QA_USERS.length} usuarios QA creados exitosamente`,
    created: results,
    failed: errors.length > 0 ? errors : undefined,
  });
}
