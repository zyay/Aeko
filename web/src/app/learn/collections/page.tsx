import Link from "next/link";
import { LearnShell } from "@/components/learn/shell";
import { COLLECTIONS } from "@/lib/learn-data";

export default function CollectionsPage() {
  return (
    <LearnShell title="My collections" subtitle="Progress by topic">
      <div className="learn-grid-2">
        {COLLECTIONS.map((c) => (
          <div key={c.id} className="learn-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12 }}>
              <div>
                <h3>{c.title}</h3>
                <p>{c.items} items</p>
              </div>
              <strong style={{ fontSize: 24, letterSpacing: "-0.04em" }}>{c.progress}%</strong>
            </div>
            <div className="learn-progress" style={{ marginTop: 16 }}>
              <span style={{ width: `${c.progress}%` }} />
            </div>
            <Link href="/learn/library" className="learn-btn sm secondary" style={{ marginTop: 16 }}>
              Open
            </Link>
          </div>
        ))}
      </div>
    </LearnShell>
  );
}
