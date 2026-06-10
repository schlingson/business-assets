import { SOURCE_BY_NAME } from "@/lib/sources";

export default function SourceBadge({ name }: { name: string }) {
  const meta = SOURCE_BY_NAME.get(name);
  const color = meta?.color ?? "#3B82F6";
  const textColor = meta?.textColor ?? "#ffffff";
  return (
    <span
      className="chip border border-white/10"
      style={{ backgroundColor: color, color: textColor }}
    >
      {name}
    </span>
  );
}
