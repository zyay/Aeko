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
    <LearnShell title="Tutor settings" subtitle="Your key stays in this browser.">
      <form className="flora-sheet flora-auth-card" onSubmit={save}>
        <Link href="/learn/plan" className="back">Back to Learn</Link>
        <h1>Tutor settings</h1>
        <p>Bring your own key. It stays in this browser.</p>
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
        <p className="tiny">Level {profile?.level ?? "—"} · {profile?.dailyMinutes ?? "—"} min a day</p>
        <button type="submit" className="learn-btn primary full">
          {saved ? "Saved" : "Save settings"}
        </button>
        <Link href="/learn/chat" className="learn-btn secondary full" style={{ marginTop: 8 }}>Open GPT chat</Link>
      </form>
    </LearnShell>
  );
}
