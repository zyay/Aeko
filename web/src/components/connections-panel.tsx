"use client";

import { useEffect, useState } from "react";
import { APP_CATALOG, type AppId } from "@/lib/connected-apps";
import { AppMark } from "@/components/app-mark";

const WHERE: Record<AppId, string[]> = {
  github: [
    "GitHub → Settings → Developer settings → Personal access tokens.",
    "Create a token that can see the repositories you care about. Include repo access if Hands should open issues.",
    "Paste it and press Connect. In a channel: @Hands list my GitHub repos.",
  ],
  linear: [
    "Linear → Settings → Security & access → Personal API keys.",
    "Create a key and copy it. It starts with lin_api_.",
    "After Connect: @Hands list open Linear issues.",
  ],
  notion: [
    "On Notion, open My integrations and create an internal integration.",
    "Copy the secret. Share each page you want read with that integration.",
    "After Connect: @Hands search Notion for the page name.",
  ],
  slack: [
    "api.slack.com/apps → your app → OAuth & Permissions.",
    "Copy the Bot User OAuth Token. It starts with xoxb-. channels:read lists channels. chat:write is only for posting.",
    "After Connect: @Hands list Slack channels.",
  ],
};
import { listConnections, removeConnection, saveConnection, testConnection } from "@/lib/connections";

export function ConnectionsPanel() {
  const [connected, setConnected] = useState(listConnections());
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const refresh = () => setConnected(listConnections());
    refresh();
    window.addEventListener("aeko-connections-change", refresh);
    return () => window.removeEventListener("aeko-connections-change", refresh);
  }, []);

  async function connect(id: AppId) {
    const token = drafts[id]?.trim() ?? "";
    const meta = APP_CATALOG.find((app) => app.id === id);
    if (token.length < 10) {
      setStatus(`Paste a ${meta?.label ?? "app"} token first.`);
      return;
    }
    setBusy(id);
    setStatus(`Checking ${meta?.label ?? "app"}…`);
    try {
      const account = await testConnection(id, token);
      saveConnection(id, token, account);
      setDrafts((current) => ({ ...current, [id]: "" }));
      setStatus(`${meta?.label} connected${account && account !== "connected" ? ` as ${account}` : ""}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not connect.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="conn-panel">
      <p className="pick-label">Connected apps</p>
      <p className="work-kicker">GitHub, Linear, Notion, and Slack. @Hands can list them and call a checked action. The token stays in this browser.</p>
      {APP_CATALOG.map((app) => {
        const live = connected.find((row) => row.id === app.id);
        return (
          <div key={app.id} className="conn-row">
            <div className="conn-head">
              <strong className="conn-name"><AppMark id={app.id} /> {app.label}</strong>
              <span>{live ? live.account || "Connected" : "Not connected"}</span>
            </div>
            <p>{app.hint}</p>
            <div className="tool-row">
              {app.actions.map((action) => (
                <span key={action.id} className={action.write ? "tool static" : "tool on static"}>{action.label}</span>
              ))}
            </div>
            <ol className="where">
              {WHERE[app.id].map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ol>
            <p className="tiny">Hands may {app.actions.map((action) => action.label.toLowerCase()).join(", ")}.</p>
            {live ? (
              <button
                type="button"
                className="tool"
                onClick={() => {
                  removeConnection(app.id);
                  setStatus(`${app.label} removed from this browser.`);
                }}
              >
                Disconnect
              </button>
            ) : (
              <div className="conn-form">
                <input
                  className="field"
                  type="password"
                  value={drafts[app.id] ?? ""}
                  placeholder={app.placeholder}
                  autoComplete="off"
                  aria-label={`${app.label} token`}
                  onChange={(event) => setDrafts((current) => ({ ...current, [app.id]: event.target.value }))}
                />
                <button type="button" className="solid slim" disabled={busy === app.id} onClick={() => connect(app.id)}>
                  {busy === app.id ? "Checking…" : "Connect"}
                </button>
              </div>
            )}
          </div>
        );
      })}
      {status && <p className="tiny">{status}</p>}
    </div>
  );
}
