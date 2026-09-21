"use client";

import { useRef, useState } from "react";
import { useParams } from "next/navigation";
import { LearnShell } from "@/components/learn/shell";
import { getPodcast } from "@/lib/learn-data";
import { completeTask, markItemComplete } from "@/lib/learn-store";

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ListenPage() {
  const params = useParams();
  const id = String(params.id ?? "daily-news");
  const podcast = getPodcast(id);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  if (!podcast) {
    return (
      <LearnShell title="Not found" subtitle="This podcast is not in the library.">
        <a href="/learn/library" className="learn-btn primary">
          Back to library
        </a>
      </LearnShell>
    );
  }

  const ep = podcast.episodes[0];

  function togglePlay() {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      void el.play();
      setPlaying(true);
    }
  }

  function skip(delta: number) {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = Math.max(0, Math.min(el.duration || 0, el.currentTime + delta));
  }

  function finishListening() {
    markItemComplete(id);
    completeTask("listen", 15);
  }

  return (
    <LearnShell title={podcast.title} subtitle={`Podcast · ${podcast.tag}`}>
      <audio
        ref={audioRef}
        src={podcast.audioUrl}
        onTimeUpdate={() => {
          const el = audioRef.current;
          if (!el) return;
          setCurrent(el.currentTime);
          setProgress(el.duration ? (el.currentTime / el.duration) * 100 : 0);
        }}
        onLoadedMetadata={() => {
          const el = audioRef.current;
          if (el) setDuration(el.duration);
        }}
        onEnded={() => {
          setPlaying(false);
          finishListening();
        }}
      />
      <div className="learn-player">
        <div className="learn-cover" aria-hidden />
        <div>
          <h2 style={{ margin: "0 0 8px", fontSize: 24, letterSpacing: "-0.03em" }}>{ep.title}</h2>
          <p style={{ color: "var(--learn-muted)", margin: 0 }}>
            Episode 1 · {ep.duration}
          </p>
          <div className="learn-player-controls">
            <button type="button" aria-label="Back 15s" onClick={() => skip(-15)}>
              ↺
            </button>
            <button type="button" className="play" aria-label={playing ? "Pause" : "Play"} onClick={togglePlay}>
              {playing ? "❚❚" : "▶"}
            </button>
            <button type="button" aria-label="Forward 15s" onClick={() => skip(15)}>
              ↻
            </button>
          </div>
          <div className="learn-progress" style={{ height: 6 }}>
            <span style={{ width: `${progress}%` }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--learn-muted)", marginTop: 8 }}>
            <span>{fmt(current)}</span>
            <span>{duration ? fmt(duration) : ep.duration}</span>
          </div>
          <button type="button" className="learn-btn secondary sm" style={{ marginTop: 16 }} onClick={finishListening}>
            Mark complete
          </button>
        </div>
      </div>

      <div className="learn-card" style={{ marginTop: 24 }}>
        <h3>Contents</h3>
        <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
          {podcast.episodes.map((item, i) => (
            <div key={item.id} className="learn-content-row">
              <div className="learn-content-copy">
                <strong>
                  {i + 1}. {item.title}
                </strong>
                <span>{item.duration}</span>
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
