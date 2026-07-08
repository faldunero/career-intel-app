const LABEL: Record<string, string> = {
  done: "Texto leído",
  error: "Error",
  pending: "Pendiente",
};

const CLASS: Record<string, string> = {
  done: "bg-green-100 text-green-700",
  error: "bg-red-100 text-red-700",
  pending: "bg-amber-100 text-amber-700",
};

// Antes esta lógica (y sus 2 objetos de mapeo) estaba copiada entre la
// lista de CVs y la lista de perfiles de LinkedIn.
export default function DocumentStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
        CLASS[status] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {LABEL[status] ?? status}
    </span>
  );
}
