"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { LearnShell } from "@/components/learn/shell";
import { loadProfile, loadTutorConfig, saveTutorConfig } from "@/lib/learn-store";

export default function LearnSettingsPage() {
  const [baseUrl, setBaseUrl] = useState(() => loadTutorConfig().baseUrl);
  const [apiKey, setApiKey] = useState(() => loadTutorConfig().apiKey);
  const [model, setModel] = useState(() => loadTutorConfig().model);
  const [saved, setSaved] = useState(false);
  const profile = loadProfile();

  function save(e: FormEvent) {
    e.preventDefault();
    saveTutorConfig({ baseUrl, apiKey, model, valid: Boolean(baseUrl && apiKey && model) });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <LearnShell title="Tutor settings" subtitle="Bring your own key for GPT chat practice">
      <div className="learn-grid-2">
        <form className="learn-card" onSubmit={save}>
          <div className="learn-field">
            <label htmlFor="base">API base URL</label>
            <input id="base" className="learn-input" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://api.openai.com/v1" />
          </div>
          <div className="learn-field">
            <label htmlFor="key">API key</label>
            <input id="key" type="password" className="learn-input" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-…" />
          </div>
          <div className="learn-field">
            <label htmlFor="model">Model</label>
            <input id="model" className="learn-input" value={model} onChange={(e) => setModel(e.target.value)} placeholder="gpt-4o-mini" />
          </div>
          <button type="submit" className="learn-btn primary">
            {saved ? "Saved" : "Save settings"}
          </button>
        </form>
        <div className="learn-card soft">
          <h3>Your profile</h3>
          <p>Level: {profile?.level ?? "—"}</p>
          <p>Daily goal: {profile?.dailyMinutes ?? "—"} min</p>
          <p style={{ marginTop: 12, fontSize: 13, color: "var(--learn-muted)" }}>
            Keys stay in this browser. Server demo mode works when LEARN_TUTOR_API_KEY is set on Vercel.
          </p>
          <Link href="/learn/chat" className="learn-btn secondary full" style={{ marginTop: 16 }}>
            Open GPT chat
          </Link>
        </div>
      </div>
    </LearnShell>
  );
}
