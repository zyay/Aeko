"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { BrainConfig } from "@/components/aeko-app-types";
import { IconBack } from "@/components/ui-primitives";
import { FloraFrame } from "@/components/flora-shell";
import { signOutNow } from "@/lib/sign-out";
import { ProviderStep } from "@/components/provider-step";
import { AgentStep } from "@/components/agent-step";
import { createCustomAgent, type AgentTool } from "@/lib/agents";
import { ConnectionsPanel } from "@/components/connections-panel";
import { WORKSPACE_NAME_KEY, WORKSPACE_PURPOSE_KEY, PINNED_AGENT_KEY } from "@/lib/setup-draft";
import {
  ACCOUNT_COPY,
  AGENT_COPY,
  APP_COPY,
  MODEL_COPY,
  SettingsRow,
  SettingsSection,
  WORKSPACE_COPY,
} from "@/components/settings-guide";
import { readUsage, todayTurns, tokensGuess } from "@/lib/usage";

const PAGES = [
  { id: "workspace", label: "General", hint: "Name and purpose" },
  { id: "model", label: "Model", hint: "Provider and key" },
  { id: "bots", label: "Agents", hint: "Who answers" },
  { id: "apps", label: "Integrations", hint: "App tokens" },
  { id: "account", label: "Account", hint: "Save and sign out" },
] as const;

type PageId = (typeof PAGES)[number]["id"];
const ease = [0.22, 1, 0.36, 1] as const;

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
  const reduce = useReducedMotion();
  const [page, setPage] = useState<PageId>("workspace");
  const [cfg, setCfg] = useState<BrainConfig>(initial);
  const [status, setStatus] = useState("");
  const [saved, setSaved] = useState("");
  const [workspace, setWorkspace] = useState("");
  const [purpose, setPurpose] = useState("");
  const [botName, setBotName] = useState("");
  const [botRole, setBotRole] = useState("");
  const [botPrompt, setBotPrompt] = useState("");
  const [botTools, setBotTools] = useState<AgentTool[]>(["web_search", "file_read", "doc_edit", "skill_read", "app_list", "app_call"]);

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
    setSaved("Saved on this browser.");
  }

  function saveAll() {
    saveWorkspace();
    onDone({ ...cfg, onboarded: true, onboardingStep: 3 });
  }

  function go(next: PageId) {
    if (page === "workspace") saveWorkspace();
    setSaved("");
    setPage(next);
  }

  return (
    <FloraFrame>
      <div className="flora-sheet flora-auth-card meet settings-sheet">
        <div className="settings-head">
          <button className="back" type="button" onClick={onBack}>
            <IconBack /> Desk
          </button>
          <div>
            <h1>Settings</h1>
            <p className="sub">{userEmail}</p>
          </div>
          <span className={`settings-live${cfg.valid ? " on" : ""}`}>{cfg.valid ? "Model ready" : "Model not checked"}</span>
        </div>
        <div className="settings-layout">
          <nav className="settings-nav" aria-label="Settings">
            {PAGES.map((item) => (
              <button key={item.id} type="button" className={page === item.id ? "on" : ""} onClick={() => go(item.id)}>
                <strong>{item.label}</strong>
                <span>{item.hint}</span>
              </button>
            ))}
          </nav>
          <div className="settings-main">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={page}
                className="step-pane"
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -6 }}
                transition={{ duration: reduce ? 0 : 0.22, ease }}
              >
                {page === "workspace" && (
                  <SettingsSection title={WORKSPACE_COPY.title} description={WORKSPACE_COPY.description}>
                    <SettingsRow label="Workspace name" hint="Shown on the desk and in the sidebar." htmlFor="settings-workspace">
                      <input id="settings-workspace" className="field" value={workspace} placeholder="Studio" onChange={(e) => { setWorkspace(e.target.value); setSaved(""); }} />
                    </SettingsRow>
                    <SettingsRow label="Purpose" hint="A note for you. It is not sent to a model by itself." htmlFor="settings-purpose">
                      <input id="settings-purpose" className="field" value={purpose} placeholder="Product work, research, a class" onChange={(e) => { setPurpose(e.target.value); setSaved(""); }} />
                    </SettingsRow>
                    <div className="settings-card-foot">
                      {saved ? <p className="tiny ok">{saved}</p> : <p className="tiny">Nothing is uploaded.</p>}
                      <button className="solid" type="button" onClick={saveWorkspace}>Save</button>
                    </div>
                  </SettingsSection>
                )}
                {page === "model" && (
                  <SettingsSection title={MODEL_COPY.title} description={MODEL_COPY.description}>
                    <div className="settings-stack">
                      <ProviderStep cfg={cfg} setCfg={setCfg} />
                    </div>
                  </SettingsSection>
                )}
                {page === "bots" && (
                  <SettingsSection title={AGENT_COPY.title} description={AGENT_COPY.description}>
                    <div className="settings-stack">
                      <AgentStep
                        botName={botName}
                        botRole={botRole}
                        botPrompt={botPrompt}
                        botTools={botTools}
                        status={status}
                        onName={setBotName}
                        onRole={setBotRole}
                        onPrompt={setBotPrompt}
                        onTools={setBotTools}
                        onCreate={() => {
                          const agent = createCustomAgent({ name: botName, tagline: botRole, systemPrompt: botPrompt, tools: botTools });
                          localStorage.setItem(PINNED_AGENT_KEY, agent.id);
                          setBotName("");
                          setBotRole("");
                          setBotPrompt("");
                          setStatus(`Created ${agent.name}. It is pinned for new channels.`);
                        }}
                      />
                    </div>
                  </SettingsSection>
                )}
                {page === "apps" && (
                  <SettingsSection title={APP_COPY.title} description={APP_COPY.description}>
                    <div className="settings-stack">
                      <ConnectionsPanel />
                    </div>
                  </SettingsSection>
                )}
                {page === "account" && (
                  <SettingsSection title={ACCOUNT_COPY.title} description={ACCOUNT_COPY.description}>
                    <UsagePanel />
                    <ul className="setup-review">
                      <li><span>Workspace</span><strong>{workspace.trim() || "Untitled"}</strong></li>
                      <li><span>Purpose</span><strong>{purpose.trim() || "Not set"}</strong></li>
                      <li><span>Model</span><strong>{cfg.model || "Not set"}</strong></li>
                      <li><span>Account</span><strong>{userEmail}</strong></li>
                    </ul>
                    <div className="settings-card-foot">
                      <button className="solid" type="button" onClick={saveAll}>Save this browser</button>
                    </div>
                    <div className="settings-danger">
                      <div>
                        <strong>Log out</strong>
                        <p>Ends this GitHub or Google session. Keys in this browser stay until you clear site data.</p>
                      </div>
                      <form action={signOutNow}>
                        <button className="flora-signout" type="submit">Log Out</button>
                      </form>
                    </div>
                  </SettingsSection>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </FloraFrame>
  );
}

function UsagePanel() {
  const snap = readUsage();
  return (
    <ul className="setup-review">
      <li><span>Turns today</span><strong>{todayTurns()}</strong></li>
      <li><span>Turns on this device</span><strong>{snap.turns}</strong></li>
      <li><span>Tool calls</span><strong>{snap.tools}</strong></li>
      <li><span>Est. tokens</span><strong>{tokensGuess(snap.chars)}</strong></li>
    </ul>
  );
}
