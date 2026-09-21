"use client";

import { useEffect, useRef, useState } from "react";
import { LearnShell } from "@/components/learn/shell";
import { MCP_PRESETS } from "@/lib/skills-registry";
import {
  addMcpPreset,
  downloadText,
  exportMcpJson,
  importMcpJson,
  isRiskyPreset,
  listMcpServers,
  removeMcp,
  setMcpEnv,
  toggleMcp,
  validateMcpExport,
  type McpServerConfig,
} from "@/lib/mcp-store";

export default function McpStudioPage() {
  const [servers, setServers] = useState<McpServerConfig[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [exportError, setExportError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setServers(listMcpServers());
  }, []);

  function handleExport() {
    const errors = validateMcpExport(servers);
    if (errors.length) {
      setExportError(errors.join(" · "));
      return;
    }
    setExportError("");
    if (!window.confirm("mcp.json will contain secrets. Store it safely and add to .gitignore.")) return;
    downloadText("mcp.json", exportMcpJson(servers), "application/json");
  }

  function handleImport(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const merge = window.confirm("Merge with existing servers?");
        setServers(importMcpJson(String(reader.result), merge));
      } catch {
        setExportError("Invalid mcp.json file.");
      }
    };
    reader.readAsText(file);
  }

  const presets = MCP_PRESETS.filter((p) => showAdvanced || !isRiskyPreset(p.id));

  return (
    <LearnShell
      title="MCP studio"
      subtitle="Custom MCP servers · plugins · export to Cursor"
      action={
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="learn-btn secondary sm" onClick={() => fileRef.current?.click()}>
            Import
          </button>
          <button type="button" className="learn-btn primary sm" onClick={handleExport}>
            Export mcp.json
          </button>
        </div>
      }
    >
      <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])} />

      {exportError && <div className="learn-banner warn" style={{ marginBottom: 16 }}>{exportError}</div>}

      <div className="learn-card soft" style={{ marginBottom: 20 }}>
        <h3>How it works</h3>
        <p>
          Add MCP presets below, fill required env vars, then export <code>mcp.json</code> into{" "}
          <code>%USERPROFILE%\.cursor\mcp.json</code>. Secrets stay in this browser until export.
        </p>
        <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12, fontSize: 13 }}>
          <input type="checkbox" checked={showAdvanced} onChange={(e) => setShowAdvanced(e.target.checked)} />
          Show advanced / high-privilege presets (filesystem, puppeteer)
        </label>
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
                {s.risky && <p className="learn-banner warn" style={{ marginTop: 8, padding: 8, fontSize: 12 }}>High-privilege server — use a narrow scope.</p>}
                <p style={{ fontSize: 12, color: "var(--learn-muted)", marginTop: 8 }}>
                  {s.transport} · {s.niche}
                </p>
                {s.env?.map((key) => (
                  <div key={key} className="learn-field" style={{ marginTop: 10 }}>
                    <label>{key}</label>
                    <input
                      type="password"
                      className="learn-input"
                      placeholder="••••••••"
                      value={s.envValues?.[key] ?? ""}
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
        {presets.map((p) => (
          <div key={p.id} className="learn-card learn-card-hover">
            <strong>{p.name}</strong>
            <p>{p.description}</p>
            {isRiskyPreset(p.id) && <p style={{ fontSize: 12, color: "var(--learn-muted)" }}>Advanced — broad local access</p>}
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
