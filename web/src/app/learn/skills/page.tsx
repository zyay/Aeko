"use client";

import { useCallback, useEffect, useState } from "react";
import { LearnShell } from "@/components/learn/shell";
import type { SkillEntry } from "@/lib/skills-registry";
import {
  downloadText,
  exportSkillsMarkdown,
  exportSkillsZip,
  installSkill,
  isSkillInstalled,
  listInstalledSkills,
  removeSkill,
} from "@/lib/skills-store";

export default function SkillsHubPage() {
  const [query, setQuery] = useState("");
  const [curated, setCurated] = useState<SkillEntry[]>([]);
  const [github, setGithub] = useState<SkillEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [installed, setInstalled] = useState<SkillEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [installing, setInstalling] = useState<string | null>(null);

  const refreshInstalled = useCallback(() => setInstalled(listInstalledSkills()), []);

  const load = useCallback(async (q = "") => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/skills/search?q=${encodeURIComponent(q || "filename:SKILL.md")}`);
      if (!res.ok) {
        setError(`Search failed (${res.status}). Try again in a moment.`);
        return;
      }
      const json = (await res.json()) as { curated: SkillEntry[]; github: SkillEntry[]; totalDiscoverable: number; error?: string };
      setCurated(json.curated ?? []);
      setGithub(json.github ?? []);
      setTotal(json.totalDiscoverable ?? 0);
    } catch {
      setError("Network error while searching GitHub.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshInstalled();
    void load("");
    const onChange = () => refreshInstalled();
    window.addEventListener("abc-skills-change", onChange);
    return () => window.removeEventListener("abc-skills-change", onChange);
  }, [load, refreshInstalled]);

  async function handleInstall(skill: SkillEntry) {
    setInstalling(skill.id);
    try {
      setInstalled(await installSkill(skill));
    } finally {
      setInstalling(null);
    }
  }

  return (
    <LearnShell
      title="Skills hub"
      subtitle={total > 0 ? `${total.toLocaleString()}+ discoverable on GitHub · curated niche packs` : "Curated niche skills · GitHub discovery"}
      action={
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="learn-btn secondary sm" onClick={() => downloadText("installed-skills.md", exportSkillsMarkdown(installed))}>
            Export MD
          </button>
          <button type="button" className="learn-btn secondary sm" onClick={() => void exportSkillsZip(installed)} disabled={!installed.length}>
            Export ZIP
          </button>
        </div>
      }
    >
      {error && <div className="learn-banner warn" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="learn-card soft" style={{ marginBottom: 20 }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void load(query);
          }}
          style={{ display: "flex", gap: 10 }}
        >
          <input
            className="learn-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search GitHub skills: security, mcp, terraform, ielts…"
          />
          <button type="submit" className="learn-btn primary" disabled={loading}>
            {loading ? "Searching…" : "Search"}
          </button>
        </form>
        <p style={{ marginTop: 12, fontSize: 13, color: "var(--learn-muted)" }}>
          Install fetches SKILL.md when available. Export ZIP for ~/.cursor/skills/.
        </p>
      </div>

      {installed.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 12 }}>Installed ({installed.length})</h3>
          <div className="learn-grid-2">
            {installed.map((s) => (
              <div key={s.id} className="learn-card">
                <strong>{s.name}</strong>
                <p>{s.description}</p>
                {s.content && <p style={{ fontSize: 12, color: "var(--learn-muted)" }}>SKILL.md fetched ({s.content.length} chars)</p>}
                <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                  <a href={s.repo} target="_blank" rel="noreferrer" className="learn-btn sm secondary">
                    Open repo
                  </a>
                  <button type="button" className="learn-btn sm ghost" onClick={() => setInstalled(removeSkill(s.id))}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <h3 style={{ marginBottom: 12 }}>Curated niche skills</h3>
      {loading && !curated.length ? <p className="learn-skeleton">Loading curated skills…</p> : null}
      <div className="learn-grid-3" style={{ marginBottom: 28 }}>
        {curated.map((s) => (
          <SkillCard key={s.id} skill={s} installing={installing === s.id} onInstall={() => void handleInstall(s)} />
        ))}
      </div>

      {github.length > 0 && (
        <>
          <h3 style={{ marginBottom: 12 }}>GitHub results</h3>
          <div className="learn-grid-3">
            {github.map((s) => (
              <SkillCard key={s.id} skill={s} installing={installing === s.id} onInstall={() => void handleInstall(s)} />
            ))}
          </div>
        </>
      )}
    </LearnShell>
  );
}

function SkillCard({ skill, onInstall, installing }: { skill: SkillEntry; onInstall: () => void; installing: boolean }) {
  const installed = isSkillInstalled(skill.id);
  return (
    <div className="learn-card learn-card-hover">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "start" }}>
        <strong>{skill.name}</strong>
        {installed && <span className="learn-pill sm on">Installed</span>}
        {!installed && skill.stars != null && skill.stars > 0 && <span className="learn-pill sm">★ {skill.stars}</span>}
      </div>
      <p>{skill.description}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
        {skill.tags.slice(0, 3).map((t) => (
          <span key={t} className="learn-pill sm">
            {t}
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button type="button" className="learn-btn sm primary" onClick={onInstall} disabled={installed || installing}>
          {installing ? "Installing…" : installed ? "Installed" : "Install"}
        </button>
        <a href={skill.repo} target="_blank" rel="noreferrer" className="learn-btn sm secondary">
          GitHub
        </a>
      </div>
    </div>
  );
}
