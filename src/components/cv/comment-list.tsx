type Comment = {
  id: string;
  comment: string;
};

// Antes cada burbuja de comentario llevaba un emoji 💬 delante del
// texto. Se reemplaza por una etiqueta de rol, más legible y en línea
// con el resto de la plataforma (que no usa emoji como parte de la UI).
export default function CommentList({
  comments,
  authorLabel = "Tu coach",
}: {
  comments: Comment[];
  authorLabel?: string;
}) {
  if (comments.length === 0) return null;

  return (
    <div className="mt-3 flex flex-col gap-2">
      {comments.map((c) => (
        <div
          key={c.id}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {authorLabel}
          </p>
          <p className="mt-0.5 text-sm text-slate-700">{c.comment}</p>
        </div>
      ))}
    </div>
  );
}
