"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteUserButton({
  userId,
  label,
}: {
  userId: string;
  label: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirm(`¿Eliminar la cuenta de ${label}? No se puede deshacer.`)) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al eliminar");
        setDeleting(false);
        return;
      }
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor");
    }
    setDeleting(false);
  }

  return (
    <div>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="text-xs font-medium text-red-500 underline hover:text-red-700 disabled:opacity-50"
      >
        {deleting ? "..." : "Eliminar"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
