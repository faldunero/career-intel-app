"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function UnassignButton({
  assignmentId,
}: {
  assignmentId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function handleUnassign() {
    if (!confirm("¿Quitar esta asignación?")) return;
    setLoading(true);
    await supabase
      .from("coach_assignments")
      .delete()
      .eq("id", assignmentId);
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleUnassign}
      disabled={loading}
      className="text-xs font-medium text-red-500 underline hover:text-red-700 disabled:opacity-50"
    >
      {loading ? "Quitando..." : "Quitar asignación"}
    </button>
  );
}
