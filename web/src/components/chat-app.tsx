"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { BorderBeam } from "border-beam";
import { Shdr21 } from "@/components/ui/shdr-21";

type OrbState = "idle" | "thinking" | "speaking";
type Message = { id: number; role: "user" | "lyan"; text: string };

const tips = [
  "Summarize liability clauses in this contract",
  "Fix this Python bug",
  "What can Lyan do on-device?",
  "How does Vercel sign-in work?",
];

function replyFor(prompt: string, online: boolean, agent: boolean, code: boolean, vault: string) {
  const vaultBit = vault ? `\n\nVault excerpt:\n${vault.slice(0, 500)}` : "";
  return `Lyan · ${code ? "Code Mode" : "General"} · ${agent ? "Agent" : "Chat"} · ${online ? "Online flag" : "Offline"}.

You said: “${prompt}”

Composer is official border-beam. Orb is Orbkit Shdr21 (idle / thinking / speaking). Identity is optional Auth.js on Vercel (GitHub + Google). HTTPS search/fetch runs in the Android APK when Online is on.${vaultBit}`;
}

export function ChatApp({ userEmail }: { userEmail: string | null }) {
  const [draft, setDraft] = useState("");
  const [agent, setAgent] = useState(true);
  const [auto, setAuto] = useState(true);
  const [online, setOnline] = useState(false);
  const [code, setCode] = useState(false);
  const [state, setState] = useState<OrbState>("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [vault, setVault] = useState("");
  const [vaultName, setVaultName] = useState<string | null>(null);
  const [hud, setHud] = useState("0.0 t/s");
  const fileRef = useRef<HTMLInputElement>(null);

  const volumes = useMemo(
    () => ({
      idle: { input: 0, output: 0.2 },
      thinking: { input: 0.1, output: 0.45 },
      speaking: { input: 0.2, output: 0.8 },
    }),
    [],
  );

  async function run(prompt: string) {
    if (!prompt || state !== "idle") return;
    setDraft("");
    setMessages((current) => [...current, { id: Date.now(), role: "user", text: prompt }]);
    setState("thinking");
    await wait(380);
    setState("speaking");
    const full = replyFor(code ? `Code Mode. ${prompt}` : prompt, online, agent, code, vault);
    const id = Date.now() + 1;
    setMessages((current) => [...current, { id, role: "lyan", text: "" }]);
    let built = "";
    const start = performance.now();
    const parts = full.split(/(?<=\s)/);
    for (let i = 0; i < parts.length; i++) {
      built += parts[i];
      const snapshot = built;
      const elapsed = (performance.now() - start) / 1000;
      setHud(`${(elapsed > 0.05 ? (i + 1) / elapsed : 18).toFixed(1)} t/s`);
      setMessages((current) => current.map((msg) => (msg.id === id ? { ...msg, text: snapshot } : msg)));
      await wait(14);
    }
    setState("idle");
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    await run(draft.trim());
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">Lyan</div>
        <div className="sub">Intelligence without surveillance</div>
        <button className="navbtn" type="button" onClick={() => setMessages([])}>
          New chat
        </button>
        <a className="navbtn" href="/login">
          {userEmail ?? "Sign in with GitHub / Google"}
        </a>
        <a className="navbtn" href="https://github.com/zyay/Lyan/releases/tag/latest">
          Get Android APK
        </a>
        <div className="grow" />
        <a className="navbtn" href="/privacy">
          Privacy
        </a>
        <a className="navbtn" href="/terms">
          Terms
        </a>
      </aside>

      <div className="stagewrap">
        <header className="top">
          <strong>Lyan</strong>
          <span className="hud">{hud}{online ? " · NET" : ""}</span>
        </header>

        <section className="stage">
          <Shdr21
            size={messages.length ? 92 : 280}
            state={state}
            params={{ speed: 10.2 }}
            colors={{ light: "#ffd7a3", shadow: "#3a4a8c" }}
            stateColors={{
              idle: { light: "#ffd7a3", shadow: "#3a4a8c" },
              thinking: { light: "#e6d4ff", shadow: "#3b3f96" },
              speaking: { light: "#ffb066", shadow: "#7a2f6e" },
            }}
            statePresets={{ idle: { speed: 10 }, thinking: { speed: 10.2 }, speaking: { speed: 10.4 } }}
            stateVolumes={volumes}
            wrapper="ring"
            wrapperColor="currentColor"
            volumes={{ input: 0, output: 0.6 }}
            paused={false}
            pauseOffscreen
            maxDpr={1.5}
            ariaLabel="Assistant status"
          />
          {messages.length === 0 ? (
            <>
              <h1 className="hero">What's on your mind?</h1>
              <p className="hint">Grok-style composer. Official beam + SHDR-21 orb. Local by default.</p>
              <div className="tips">
                {tips.map((tip) => (
                  <button key={tip} className="tip" type="button" onClick={() => run(tip)}>
                    {tip}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="thread">
              {messages.map((msg) => (
                <div key={msg.id} className={msg.role === "user" ? "msg user" : "msg"}>
                  <div className="who">{msg.role === "user" ? "You" : "Lyan"}</div>
                  {msg.role === "user" ? <span className="userbubble">{msg.text}</span> : msg.text}
                </div>
              ))}
            </div>
          )}
        </section>

        {vaultName && <p className="hint" style={{ textAlign: "center" }}>Vault · {vaultName}</p>}

        <form onSubmit={onSubmit} className="composer-wrap">
          <BorderBeam size="md" colorVariant="colorful" strength={0.75} theme="dark" active={state !== "thinking"}>
            <div className="composer">
              <textarea
                className="field"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Build anything."
                rows={2}
              />
              <div className="row">
                <button className="chip" type="button" onClick={() => setAgent((v) => !v)}>
                  {agent ? "Agent" : "Chat"} ▾
                </button>
                <button className="chip" type="button" onClick={() => setAuto((v) => !v)}>
                  {auto ? "Auto" : "Manual"} ▾
                </button>
                <button className="chip" type="button" onClick={() => setOnline((v) => !v)}>
                  {online ? "Online" : "Offline"} ▾
                </button>
                <button className="chip" type="button" onClick={() => setCode((v) => !v)}>
                  {code ? "Code" : "General"} ▾
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  hidden
                  accept=".txt,.md,.json,.csv,.py,.kt"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    setVaultName(file.name);
                    setVault((await file.text()).slice(0, 200000));
                  }}
                />
                <button className="chip" type="button" onClick={() => fileRef.current?.click()}>
                  Attach
                </button>
                <button className="send" type="submit" disabled={!draft.trim()}>
                  ↑
                </button>
              </div>
            </div>
          </BorderBeam>
        </form>
      </div>
    </div>
  );
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
