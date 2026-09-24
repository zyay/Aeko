"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FloraFrame } from "@/components/flora-shell";
import { Mascot } from "@/components/mascot";
import { GoogleMark, Icon, Icons } from "@/components/icons";
import { AppFooter } from "@/components/ui-primitives";
import { AGENT_ROSTER, AGENT_TOOLS, buildCustomAgent, type AgentTool } from "@/lib/agents";
import { ENDPOINT_TEMPLATES } from "@/lib/endpoints";
import { readSetupDraft, writeSetupDraft, type SetupDraft } from "@/lib/setup-draft";

const STEPS = ["Workspace", "Bot", "Connection", "Create"] as const;

const emptyDraft = (): SetupDraft => ({
  workspace: "",
  purpose: "",
  agentId: "aeko",
  custom: null,
  baseUrl: "https://api.openai.com/v1",
  model: "gpt-6-astra",
  mode: "byok",
  apiKey: "",
  skippedConnection: false,
});

export function SetupForm({
  after,
  problem,
  githubReady,
  googleReady,
  github,
  google,
}: {
  after: string;
  problem?: string;
  githubReady: boolean;
  googleReady: boolean;
  github: () => Promise<void>;
  google: () => Promise<void>;
}) {
  const [step, setStep] = useState(problem ? 3 : 0);
  const [draft, setDraft] = useState<SetupDraft>(emptyDraft);
  const [own, setOwn] = useState(false);
  const [botName, setBotName] = useState("");
  const [botRole, setBotRole] = useState("");
  const [botPrompt, setBotPrompt] = useState("");
  const [botTools, setBotTools] = useState<AgentTool[]>(["web_search", "file_read", "doc_edit", "skill_read", "app_list", "app_call"]);
  const [provider, setProvider] = useState("OpenAI");
  const providers = [...new Set(ENDPOINT_TEMPLATES.map((item) => item.provider))];
  const templates = ENDPOINT_TEMPLATES.filter((item) => item.provider === provider);

  useEffect(() => {
    const saved = readSetupDraft();
    if (!saved) return;
    setDraft(saved);
    setOwn(Boolean(saved.own || saved.custom));
    setBotName(saved.botName || saved.custom?.name || "");
    setBotRole(saved.botRole || saved.custom?.tagline || "");
    setBotPrompt(saved.botPrompt || saved.custom?.systemPrompt || "");
    if (saved.botTools?.length) setBotTools(saved.botTools);
    if (saved.provider) setProvider(saved.provider);
    if (!problem && typeof saved.step === "number") setStep(Math.min(Math.max(saved.step, 0), STEPS.length - 1));
  }, [problem]);

  function patch(next: Partial<SetupDraft>) {
    setDraft((current) => {
      const merged = { ...current, ...next };
      writeSetupDraft(merged);
      return merged;
    });
  }

  function next() {
    const upcoming = Math.min(step + 1, STEPS.length - 1);
    if (step === 1 && own) {
      const agent = buildCustomAgent(
        { name: botName, tagline: botRole, systemPrompt: botPrompt, tools: botTools },
        draft.custom?.id,
      );
      patch({ custom: agent, agentId: agent.id, own: true, botName, botRole, botPrompt, botTools, step: upcoming });
    } else if (step === 1) {
      patch({ custom: null, own: false, step: upcoming });
    } else {
      patch({ step: upcoming });
    }
    setStep(upcoming);
  }

  const botLabel = (own ? botName.trim() : "") || draft.custom?.name || AGENT_ROSTER.find((agent) => agent.id === draft.agentId)?.name || "Aeko";
  const canContinue =
    (step === 0 && draft.workspace.trim().length > 1) ||
    (step === 1 && (!own || (botName.trim().length > 1 && botPrompt.trim().length > 8))) ||
    step === 2;

  return (
    <FloraFrame>
      <section className="flora-sheet flora-signin flora-setup authcard">
        <Mascot size={36} className="flora-mark flora-mark-lg" />
        <div className="auth-switch" role="tablist">
          <Link href={`/login?callbackUrl=${encodeURIComponent(after)}`}>Sign in</Link>
          <Link href="/signup" className="on">Create workspace</Link>
        </div>
        <ol className="setup-steps">
          {STEPS.map((label, index) => (
            <li key={label} className={index === step ? "on" : index < step ? "done" : ""}>
              <span>{index + 1}</span>
              {label}
            </li>
          ))}
        </ol>

        {step === 0 && (
          <>
            <h1>Name the workspace</h1>
            <p>This is the place your channels and bots live in. You can rename it later.</p>
            <label className="setup-label" htmlFor="workspace-name">Workspace name</label>
            <input id="workspace-name" className="field" value={draft.workspace} placeholder="Studio" onChange={(e) => patch({ workspace: e.target.value })} />
            <label className="setup-label" htmlFor="workspace-purpose">What is it for</label>
            <input id="workspace-purpose" className="field" value={draft.purpose} placeholder="Product work, research, a class" onChange={(e) => patch({ purpose: e.target.value })} />
          </>
        )}

        {step === 1 && (
          <>
            <h1>Choose a bot</h1>
            <p>Start from one we already made, or write your own instructions.</p>
            <div className="setup-mode">
              <button type="button" className={own ? "tool" : "tool on"} onClick={() => { setOwn(false); patch({ own: false }); }}>Ready-made</button>
              <button type="button" className={own ? "tool on" : "tool"} onClick={() => { setOwn(true); patch({ own: true }); }}>Your own</button>
            </div>
            {!own && (
              <div className="pick-grid setup-grid">
                {AGENT_ROSTER.map((agent) => (
                  <button key={agent.id} type="button" className={draft.agentId === agent.id && !draft.custom ? "pick on" : "pick"} onClick={() => patch({ agentId: agent.id, custom: null })}>
                    <strong>{agent.name}</strong>
                    <span>{agent.tagline}</span>
                  </button>
                ))}
              </div>
            )}
            {own && (
              <div className="setup-fields">
                <label className="setup-label" htmlFor="bot-name">Name</label>
                <input id="bot-name" className="field" value={botName} placeholder="Atlas" onChange={(e) => { setBotName(e.target.value); patch({ botName: e.target.value, own: true }); }} />
                <label className="setup-label" htmlFor="bot-role">Role</label>
                <input id="bot-role" className="field" value={botRole} placeholder="Keeps the weekly brief short" onChange={(e) => { setBotRole(e.target.value); patch({ botRole: e.target.value, own: true }); }} />
                <label className="setup-label" htmlFor="bot-prompt">Instructions</label>
                <textarea id="bot-prompt" className="field" value={botPrompt} placeholder="You write a Monday brief from the notes in the channel. Lead with decisions, then open questions." onChange={(e) => { setBotPrompt(e.target.value); patch({ botPrompt: e.target.value, own: true }); }} />
                <p className="setup-label">Tools</p>
                <div className="tool-row">
                  {AGENT_TOOLS.map((tool) => {
                    const on = botTools.includes(tool.id);
                    return (
                      <button
                        key={tool.id}
                        type="button"
                        className={on ? "tool on" : "tool"}
                        onClick={() => {
                          const tools = on ? botTools.filter((id) => id !== tool.id) : [...botTools, tool.id];
                          setBotTools(tools);
                          patch({ botTools: tools, own: true });
                        }}
                      >
                        {tool.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <h1>Add a connection</h1>
            <p>Pick a host. The key stays in this browser and is never stored on the server.</p>
            <div className="tool-row">
              {providers.map((name) => (
                <button key={name} type="button" className={provider === name ? "tool on" : "tool"} onClick={() => { setProvider(name); patch({ provider: name }); }}>{name}</button>
              ))}
            </div>
            <div className="pick-grid setup-grid">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  className={draft.model === template.model && draft.baseUrl === template.baseUrl ? "pick on" : "pick"}
                  onClick={() => patch({ baseUrl: template.baseUrl, model: template.model, mode: template.mode, skippedConnection: false })}
                >
                  <strong>{template.label}</strong>
                  <span>{template.note}</span>
                </button>
              ))}
            </div>
            <label className="setup-label" htmlFor="api-key">API key</label>
            <input id="api-key" className="field" type="password" value={draft.apiKey} placeholder={draft.mode === "server" ? "Not needed for a local server" : "sk-…"} onChange={(e) => patch({ apiKey: e.target.value, skippedConnection: false })} autoComplete="off" />
            <label className="setup-label" htmlFor="model-id">Model</label>
            <input id="model-id" className="field" value={draft.model} onChange={(e) => patch({ model: e.target.value })} />
          </>
        )}

        {step === 3 && (
          <>
            <h1>Create {draft.workspace.trim() || "workspace"}</h1>
            <p>GitHub or Google is only the sign-in. The bot and the key stay on this device.</p>
            {problem && <p className="flora-error">{problem}</p>}
            <ul className="setup-review">
              <li><span>Workspace</span><strong>{draft.workspace.trim() || "Untitled"}</strong></li>
              <li><span>Bot</span><strong>{botLabel}</strong></li>
              <li><span>Model</span><strong>{draft.skippedConnection ? "Add later in settings" : draft.model}</strong></li>
            </ul>
            <div className="auth-forms">
              <form action={github}>
                <button type="submit" disabled={!githubReady}>
                  <Icon icon={Icons.brand} size={18} aria-hidden />
                  Continue with GitHub
                </button>
              </form>
              {googleReady && (
              <form action={google}>
                <button className="alt" type="submit">
                  <GoogleMark size={18} />
                  Continue with Google
                </button>
              </form>
              )}
            </div>
          </>
        )}

        <div className="setup-row">
          {step > 0 && (
            <button type="button" className="setup-back" onClick={() => setStep((value) => value - 1)}>Back</button>
          )}
          {step < 3 && (
            <button type="button" className="setup-next" disabled={!canContinue} onClick={next}>Continue</button>
          )}
          {step === 2 && (
            <button type="button" className="setup-back" onClick={() => { patch({ skippedConnection: true }); setStep(3); }}>Skip for now</button>
          )}
        </div>
          <AppFooter />
      </section>
    </FloraFrame>
  );
}
