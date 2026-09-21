"use client";

import { useEffect, useState } from "react";
import { LearnShell } from "@/components/learn/shell";
import { MCP_PRESETS } from "@/lib/skills-registry";
import {
  addMcpPreset,
  downloadText,
  exportMcpJson,
  listMcpServers,
  removeMcp,
  setMcpEnv,
  toggleMcp,
  type McpServerConfig,
} from "@/lib/mcp-store";

export default function McpStudioPage() {
  const [servers, setServers] = useState<McpServerConfig[]>([]);

  useEffect(() => {
    setServers(listMcpServers());
  }, []);

  return (
    <LearnShell
      title="MCP studio"
      subtitle="Custom MCP servers · plugins · export to Cursor"
      action={
        <button type="button" className="learn-btn primary sm" onClick={() => downloadText("mcp.json", exportMcpJson(servers))}>
          Export mcp.json
        </button>
      }
    >
      <div className="learn-card soft" style={{ marginBottom: 20 }}>
        <h3>How it works</h3>
        <p>
          Add MCP presets below, toggle env vars locally, then export <code>mcp.json</code> into{" "}
          <code>%USERPROFILE%\.cursor\mcp.json</code>. Secrets stay in your browser until export.
        </p>
      </div>

      {servers.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ marginBottom: 12 }}>Your servers</h3>
          <div className="learn-grid-2">
            {servers.map((s) => (
              <div key={s.id} className="learn-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong>{s.name}</strong>
                  <button type="button" className={`learn-pill sm ${s.enabled ? "on" : ""}`} onClick={() => setServers(toggleMcp(s.id, !s.enabled))}>
                    {s.enabled ? "On" : "Off"}
                  </button>
                </div>
                <p>{s.description}</p>
                <p style={{ fontSize: 12, color: "var(--learn-muted)", marginTop: 8 }}>
                  {s.transport} · {s.niche}
                </p>
                {s.env?.map((key) => (
                  <div key={key} className="learn-field" style={{ marginTop: 10 }}>
                    <label>{key}</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      onChange={(e) => setServers(setMcpEnv(s.id, key, e.target.value))}
                    />
                  </div>
                ))}
                <button type="button" className="learn-btn sm ghost" style={{ marginTop: 12 }} onClick={() => setServers(removeMcp(s.id))}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <h3 style={{ marginBottom: 12 }}>Strongest niche MCP presets</h3>
      <div className="learn-grid-3">
        {MCP_PRESETS.map((p) => (
          <div key={p.id} className="learn-card">
            <strong>{p.name}</strong>
            <p>{p.description}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {p.tags.map((t) => (
                <span key={t} className="learn-pill sm">
                  {t}
                </span>
              ))}
            </div>
            <button type="button" className="learn-btn sm primary" style={{ marginTop: 14 }} onClick={() => setServers(addMcpPreset(p))}>
              Add plugin
            </button>
          </div>
        ))}
      </div>
    </LearnShell>
  );
}
