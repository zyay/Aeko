"use client";

import Link from "next/link";
import { LearnShell } from "@/components/learn/shell";
import { COLLECTIONS, LIBRARY_ITEMS } from "@/lib/learn-data";
import { getCompletedItems } from "@/lib/learn-store";

function collectionProgress(topicIds: string[], completed: string[]) {
  const all = [...LIBRARY_ITEMS.books, ...LIBRARY_ITEMS.podcasts, ...LIBRARY_ITEMS.video].filter((item) =>
    item.topicIds.some((t) => topicIds.includes(t)),
  );
  if (!all.length) return 0;
  const done = all.filter((item) => completed.includes(item.id)).length;
  return Math.round((done / all.length) * 100);
}

export default function CollectionsPage() {
  const completed = getCompletedItems();

  return (
    <LearnShell title="My collections" subtitle="Progress by topic">
      <div className="learn-grid-2">
        {COLLECTIONS.map((c) => {
          const progress = collectionProgress(c.topicIds, completed);
          return (
            <div key={c.id} className="learn-card learn-card-hover">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12 }}>
                <div>
                  <h3>{c.title}</h3>
                  <p>{c.items} items</p>
                </div>
                <strong style={{ fontSize: 24, letterSpacing: "-0.04em" }}>{progress}%</strong>
              </div>
              <div className="learn-progress" style={{ marginTop: 16 }}>
                <span style={{ width: `${progress}%` }} />
              </div>
              <Link href="/learn/library" className="learn-btn sm secondary" style={{ marginTop: 16 }}>
                Open
              </Link>
            </div>
          );
        })}
      </div>
    </LearnShell>
  );
}
