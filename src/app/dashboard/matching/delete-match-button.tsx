"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DeleteMatchButton({ matchId }: { matchId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("¿Eliminar este análisis de matching?")) return;

    setDeleting(true);
    const { error } = await supabase
      .from("job_matches")
      .delete()
      .eq("id", matchId);
    setDeleting(false);

    if (error) {
      alert(`Error al eliminar: ${error.message}`);
      return;
    }

    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="text-xs font-medium text-red-500 underline hover:text-red-700 disabled:opacity-50"
    >
      {deleting ? "Eliminando..." : "Eliminar"}
    </button>
  );
}
