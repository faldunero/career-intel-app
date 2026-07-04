import Link from "next/link";

export default function StatCard({
  label,
  value,
  href,
  tone = "default",
}: {
  label: string;
  value: number | string;
  href: string;
  tone?: "default" | "warning";
}) {
  return (
    <Link
      href={href}
      className={`group flex flex-col justify-between border p-5 transition ${
        tone === "warning"
          ? "border-black bg-black text-white hover:bg-[#1a1a1a]"
          : "border-black bg-white text-black hover:bg-[#f5f5f5]"
      }`}
    >
      <div>
        <p className="text-3xl font-semibold">{value}</p>
        <p
          className={`mt-1 text-sm ${
            tone === "warning" ? "text-[#ccc]" : "text-[#555]"
          }`}
        >
          {label}
        </p>
      </div>
      <span
        className={`mt-4 text-xs font-medium underline ${
          tone === "warning" ? "text-white" : "text-black"
        }`}
      >
        Ver detalle →
      </span>
    </Link>
  );
}
