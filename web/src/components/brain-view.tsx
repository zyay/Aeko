"use client";

import { useEffect, useState } from "react";
import type { BrainConfig } from "@/components/aeko-app-types";
import { shouldUseProxy } from "@/lib/llm";
import { AppFooter, IconBack } from "@/components/ui-primitives";
import { FloraFrame } from "@/components/flora-shell";
import { Mascot } from "@/components/mascot";
import { signOutNow } from "@/lib/sign-out";
import { BotPick, EndpointPick } from "@/components/picks";
import { AGENT_TOOLS, createCustomAgent, type AgentTool } from "@/lib/agents";
import { WORKSPACE_NAME_KEY, WORKSPACE_PURPOSE_KEY, PINNED_AGENT_KEY } from "@/lib/setup-draft";

export function BrainForm({
  userEmail,
  initial,
  onBack,
  onDone,
}: {
  userEmail: string;
  initial: BrainConfig;
  onBack: () => void;
  onDone: (cfg: BrainConfig) => void;
}) {
  const [cfg, setCfg] = useState<BrainConfig>(initial);
  const [status, setStatus] = useState("");
  const [workspace, setWorkspace] = useState("");
  const [purpose, setPurpose] = useState("");
  const [botName, setBotName] = useState("");
  const [botRole, setBotRole] = useState("");
  const [botPrompt, setBotPrompt] = useState("");
  const [botTools, setBotTools] = useState<AgentTool[]>(["web_search", "file_read", "doc_edit", "skill_read"]);

  useEffect(() => {
    setWorkspace(localStorage.getItem(WORKSPACE_NAME_KEY) || "");
    setPurpose(localStorage.getItem(WORKSPACE_PURPOSE_KEY) || "");
  }, []);

  function saveWorkspace() {
    const name = workspace.trim();
    const about = purpose.trim();
    if (name) localStorage.setItem(WORKSPACE_NAME_KEY, name);
    localStorage.setItem(WORKSPACE_PURPOSE_KEY, about);
    window.dispatchEvent(new Event("aeko-workspace-change"));
  }

  return (
    <FloraFrame>
      <div className="flora-sheet flora-auth-card meet">
        <button className="back" type="button" onClick={onBack}>
          <IconBack /> Back to workspace
        </button>
        <Mascot size={36} label="Aeko" />
        <h1>Settings</h1>
        <p className="sub">Signed in as {userEmail}</p>
        <label className="setup-label" htmlFor="settings-workspace">Workspace name</label>
        <input id="settings-workspace" className="field" value={workspace} placeholder="Studio" onChange={(e) => setWorkspace(e.target.value)} />
        <label className="setup-label" htmlFor="settings-purpose">What it is for</label>
        <input id="settings-purpose" className="field" value={purpose} placeholder="Product work, research, a class" onChange={(e) => setPurpose(e.target.value)} />
        <EndpointPick
          activeModel={cfg.model}
          activeBase={cfg.baseUrl}
          onPick={(template) =>
            setCfg({
              ...cfg,
              mode: template.mode,
              baseUrl: template.baseUrl,
              model: template.model,
              proxyViaVercel: template.mode === "server" ? cfg.proxyViaVercel : false,
            })
          }
        />
        <BotPick />
        <p className="pick-label">Your own bot</p>
        <input className="field" value={botName} placeholder="Name" onChange={(e) => setBotName(e.target.value)} />
        <input className="field" value={botRole} placeholder="Role" onChange={(e) => setBotRole(e.target.value)} />
        <textarea className="field" value={botPrompt} placeholder="Instructions" onChange={(e) => setBotPrompt(e.target.value)} />
        <div className="tool-row">
          {AGENT_TOOLS.map((tool) => {
            const on = botTools.includes(tool.id);
            return (
              <button
                key={tool.id}
                type="button"
                className={on ? "tool on" : "tool"}
                onClick={() => setBotTools((current) => (on ? current.filter((id) => id !== tool.id) : [...current, tool.id]))}
              >
                {tool.label}
              </button>
            );
          })}
        </div>
        <button
          className="cardbtn"
          type="button"
          disabled={botName.trim().length < 2 || botPrompt.trim().length < 8}
          onClick={() => {
            const agent = createCustomAgent({ name: botName, tagline: botRole, systemPrompt: botPrompt, tools: botTools });
            localStorage.setItem(PINNED_AGENT_KEY, agent.id);
            setBotName("");
            setBotRole("");
            setBotPrompt("");
            setStatus(`Created ${agent.name}.`);
          }}
        >
          Create bot
        </button>
        <input className="field" value={cfg.baseUrl} onChange={(e) => setCfg({ ...cfg, baseUrl: e.target.value })} placeholder="Base URL" />
        <input className="field" type="password" value={cfg.apiKey} onChange={(e) => setCfg({ ...cfg, apiKey: e.target.value })} placeholder="API key" autoComplete="off" />
        <input className="field" value={cfg.model} onChange={(e) => setCfg({ ...cfg, model: e.target.value })} placeholder="gpt-6-astra" />
        <button
          className={cfg.proxyViaVercel ? "cardbtn on" : "cardbtn"}
          type="button"
          onClick={() => setCfg({ ...cfg, proxyViaVercel: !cfg.proxyViaVercel })}
        >
          Route via server proxy<span>For a local server reached through this site</span>
        </button>
        <button
          className="cardbtn"
          type="button"
          onClick={async () => {
            setStatus("Testing…");
            const { testBrain } = await import("@/lib/llm");
            try {
              const useProxy = shouldUseProxy(cfg.baseUrl, cfg.mode, cfg.proxyViaVercel);
              const ok = await testBrain(cfg.baseUrl, cfg.apiKey, cfg.model, useProxy);
              setCfg((c) => ({ ...c, valid: ok }));
              setStatus(ok ? "Connected." : "Could not reach model.");
            } catch (e) {
              setStatus(String(e));
            }
          }}
        >
          Test connection
        </button>
        <p className="sub">Keys and message plaintext stay in this browser. The server stores ciphertext only.</p>
        <p className="tiny">{status}</p>
        <button
          className="blackpill full"
          type="button"
          onClick={() => {
            saveWorkspace();
            onDone({ ...cfg, onboarded: true, onboardingStep: 3 });
          }}
        >
          Save
        </button>
        <form action={signOutNow}>
          <button className="flora-signout" type="submit">
            Sign out
          </button>
        </form>
        <AppFooter />
      </div>
    </FloraFrame>
  );
}
