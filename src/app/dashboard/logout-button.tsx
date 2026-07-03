"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full border border-[#333] px-4 py-2 text-sm font-medium text-[#ccc] transition hover:bg-[#1a1a1a] hover:text-white"
    >
      Cerrar sesión
    </button>
  );
}
