"use client";

import { FormEvent, useMemo, useState, type CSSProperties } from "react";
import { BorderBeam } from "border-beam";
import { Shdr21 } from "@/components/ui/shdr-21";

type OrbState = "idle" | "thinking" | "speaking";

type Message = {
  id: number;
  role: "user" | "lyan";
  text: string;
};

function replyFor(prompt: string, online: boolean) {
  return `Lyan in this browser tab.\n\nYou said: “${prompt}”\n\nBeam is npm border-beam. Orb is Orbkit Shdr21. Sign-in is optional Vercel Auth.js (GitHub/Google). ${
    online
      ? "Online mode is a UI flag here; HTTPS search/fetch runs in the Android app."
      : "Offline: nothing is sent to a model API."
  }`;
}

export function ChatApp({ userEmail }: { userEmail: string | null }) {
  const [draft, setDraft] = useState("");
  const [agent, setAgent] = useState(true);
  const [auto, setAuto] = useState(true);
  const [online, setOnline] = useState(false);
  const [state, setState] = useState<OrbState>("idle");
  const [messages, setMessages] = useState<Message[]>([]);

  const volumes = useMemo(
    () => ({
      idle: { input: 0, output: 0.2 },
      thinking: { input: 0.1, output: 0.45 },
      speaking: { input: 0.2, output: 0.8 },
    }),
    [],
  );

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const prompt = draft.trim();
    if (!prompt || state !== "idle") return;
    setDraft("");
    setMessages((current) => [...current, { id: Date.now(), role: "user", text: prompt }]);
    setState("thinking");
    await wait(420);
    setState("speaking");
    const full = replyFor(prompt, online);
    const id = Date.now() + 1;
    setMessages((current) => [...current, { id, role: "lyan", text: "" }]);
    let built = "";
    for (const chunk of full.split(/(?<=\s)/)) {
      built += chunk;
      const snapshot = built;
      setMessages((current) => current.map((msg) => (msg.id === id ? { ...msg, text: snapshot } : msg)));
      await wait(18);
    }
    setState("idle");
  }

  return (
    <main style={shell}>
      <header style={topBar}>
        <a href="/privacy" style={ghost}>
          Privacy
        </a>
        <strong>Lyan</strong>
        <span>
          {userEmail ? (
            <a href="/login" style={ghost}>
              {userEmail}
            </a>
          ) : (
            <a href="/login" style={ghost}>
              Sign in
            </a>
          )}
          {" · "}
          <a href="/terms" style={ghost}>
            Terms
          </a>
        </span>
      </header>

      <section style={stage}>
        <Shdr21
          size={messages.length ? 88 : 280}
          state={state}
          params={{ speed: 10.2 }}
          colors={{ light: "#ffd7a3", shadow: "#3a4a8c" }}
          stateColors={{
            idle: { light: "#ffd7a3", shadow: "#3a4a8c" },
            thinking: { light: "#e6d4ff", shadow: "#3b3f96" },
            speaking: { light: "#ffb066", shadow: "#7a2f6e" },
          }}
          statePresets={{
            idle: { speed: 10 },
            thinking: { speed: 10.2 },
            speaking: { speed: 10.4 },
          }}
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
          <h1 style={hero}>What's on your mind?</h1>
        ) : (
          <div style={thread}>
            {messages.map((msg) => (
              <p key={msg.id} style={{ ...bubble, textAlign: msg.role === "user" ? "right" : "left" }}>
                {msg.text}
              </p>
            ))}
          </div>
        )}
      </section>

      <form onSubmit={onSubmit} style={composerWrap}>
        <BorderBeam size="md" colorVariant="colorful" strength={0.7} theme="dark" active={state !== "thinking"}>
          <div style={composer}>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Build anything."
              style={field}
            />
            <div style={row}>
              <button type="button" style={chip} onClick={() => setAgent((value) => !value)}>
                {agent ? "Agent" : "Chat"} ▾
              </button>
              <button type="button" style={chip} onClick={() => setAuto((value) => !value)}>
                {auto ? "Auto" : "Manual"} ▾
              </button>
              <button type="button" style={chip} onClick={() => setOnline((value) => !value)}>
                {online ? "Online" : "Offline"} ▾
              </button>
              <span style={{ flex: 1 }} />
              <button type="submit" style={send} disabled={!draft.trim()}>
                +
              </button>
            </div>
          </div>
        </BorderBeam>
      </form>
    </main>
  );
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

const shell: CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  background: "#0a0a0a",
  color: "#f4f4f5",
};

const topBar: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 16px",
};

const stage: CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 24,
  padding: 16,
};

const hero: CSSProperties = {
  margin: 0,
  fontSize: 28,
  fontWeight: 500,
};

const thread: CSSProperties = {
  width: "min(720px, 100%)",
  maxHeight: "42vh",
  overflow: "auto",
};

const bubble: CSSProperties = {
  margin: "0 0 12px",
  whiteSpace: "pre-wrap",
  lineHeight: 1.5,
};

const composerWrap: CSSProperties = {
  width: "min(720px, calc(100% - 32px))",
  margin: "0 auto 24px",
};

const composer: CSSProperties = {
  padding: 16,
  borderRadius: 28,
  background: "#1a1a1a",
  border: "1px solid #2a2a2a",
};

const field: CSSProperties = {
  width: "100%",
  background: "transparent",
  border: "none",
  outline: "none",
  color: "#f4f4f5",
  fontSize: 16,
  minHeight: 48,
};

const row: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginTop: 8,
};

const chip: CSSProperties = {
  background: "#222",
  color: "#f4f4f5",
  border: "1px solid #2e2e2e",
  borderRadius: 20,
  padding: "8px 12px",
};

const send: CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 18,
  border: "none",
  background: "#fff",
  color: "#111",
};

const ghost: CSSProperties = {
  background: "transparent",
  color: "#a1a1aa",
  textDecoration: "none",
};
