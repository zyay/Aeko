"use client";

import Link from "next/link";
import { useState } from "react";
import { LearnShell } from "@/components/learn/shell";
import { LIBRARY_ITEMS, recommendByTopics, topicLabels } from "@/lib/learn-data";
import { loadProfile } from "@/lib/learn-store";

type Tab = "books" | "podcasts" | "video";

export default function LibraryPage() {
  const [tab, setTab] = useState<Tab>("books");
  const profile = loadProfile();
  const rec = recommendByTopics(profile?.topics ?? []);
  const items = tab === "books" ? rec.books : tab === "podcasts" ? rec.podcasts : rec.video;

  return (
    <LearnShell title="Library" subtitle="Recently watched and recommendations">
      <div className="learn-tabs">
        {(["books", "podcasts", "video"] as Tab[]).map((t) => (
          <button key={t} type="button" className={`learn-tab ${tab === t ? "on" : ""}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="learn-grid-2">
        <div>
          <h3 style={{ margin: "0 0 12px", fontSize: 15 }}>For you</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {items.map((item) => (
              <Link
                key={item.id}
                href={tab === "podcasts" ? `/learn/listen/${item.id}` : `/learn/read/${item.id}`}
                className="learn-content-row learn-card-hover"
              >
                <div className="learn-thumb" />
                <div className="learn-content-copy">
                  <strong>{item.title}</strong>
                  <span>
                    {item.tag} · {item.minutes} min
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
        <div className="learn-card soft">
          <h3>Recommendations</h3>
          <p>
            Based on your topics:{" "}
            {profile?.topics?.length ? topicLabels(profile.topics).join(", ") : "Art, Technology, Travel"}.
          </p>
          <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
            {rec.books.slice(0, 2).map((item) => (
              <Link key={item.id} href={`/learn/read/${item.id}`} className="learn-content-row">
                <div className="learn-thumb" />
                <div className="learn-content-copy">
                  <strong>{item.title}</strong>
                  <span>{item.tag}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="learn-card" style={{ marginTop: 20 }}>
        <h3>All {tab}</h3>
        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          {LIBRARY_ITEMS[tab].map((item) => (
            <Link
              key={item.id}
              href={tab === "podcasts" ? `/learn/listen/${item.id}` : `/learn/read/${item.id}`}
              className="learn-content-row"
            >
              <div className="learn-thumb" />
              <div className="learn-content-copy">
                <strong>{item.title}</strong>
                <span>
                  {item.tag} · {item.minutes} min
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </LearnShell>
  );
}
