"use client";

import { LearnShell } from "@/components/learn/shell";
import { PODCAST } from "@/lib/learn-data";

export default function ListenPage() {
  return (
    <LearnShell title={PODCAST.title} subtitle="Podcast · Daily news digest">
      <div className="learn-player">
        <div className="learn-cover" aria-hidden />
        <div>
          <h2 style={{ margin: "0 0 8px", fontSize: 24, letterSpacing: "-0.03em" }}>Markets and climate policy</h2>
          <p style={{ color: "var(--learn-muted)", margin: 0 }}>Episode 1 · 12:04</p>
          <div className="learn-player-controls">
            <button type="button" aria-label="Back 15s">
              ↺
            </button>
            <button type="button" className="play" aria-label="Play">
              ▶
            </button>
            <button type="button" aria-label="Forward 15s">
              ↻
            </button>
          </div>
          <div className="learn-progress" style={{ height: 6 }}>
            <span style={{ width: "35%" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--learn-muted)", marginTop: 8 }}>
            <span>4:12</span>
            <span>12:04</span>
          </div>
        </div>
      </div>

      <div className="learn-card" style={{ marginTop: 24 }}>
        <h3>Contents</h3>
        <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
          {PODCAST.episodes.map((ep, i) => (
            <div key={ep.id} className="learn-content-row">
              <div className="learn-content-copy">
                <strong>
                  {i + 1}. {ep.title}
                </strong>
                <span>{ep.duration}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="learn-card soft" style={{ marginTop: 16 }}>
        <h3>Transcript</h3>
        <p style={{ lineHeight: 1.7, marginTop: 12 }}>
          Today we look at how cities are linking transport investment to climate targets. Officials in several capitals argue that
          sustainable mobility is no longer optional — it is central to economic competitiveness…
        </p>
      </div>
    </LearnShell>
  );
}
