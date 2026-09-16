import type { CSSProperties } from "react";

export const BLOBS = [
  { color: "#22c55e", x: "18%", y: "12%", s: 72 },
  { color: "#fb7185", x: "62%", y: "10%", s: 86 },
  { color: "#a78bfa", x: "8%", y: "38%", s: 70 },
  { color: "#fb923c", x: "12%", y: "62%", s: 92 },
  { color: "#38bdf8", x: "8%", y: "82%", s: 64 },
  { color: "#f97316", x: "58%", y: "78%", s: 78 },
  { color: "#2dd4bf", x: "78%", y: "48%", s: 58 },
  { color: "#d97706", x: "72%", y: "28%", s: 54 },
];

export function Blob({
  color,
  size = 56,
  className,
  style,
}: {
  color: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={className ?? "blob"} style={{ width: size, height: size, ...style }}>
      <div className="blob-body" style={{ background: color }} />
      <div className="eyes">
        <i />
        <i />
      </div>
    </div>
  );
}
