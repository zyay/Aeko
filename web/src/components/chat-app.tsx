"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { BorderBeam } from "border-beam";
import { Shdr21 } from "@/components/ui/shdr-21";
import { Onboarding } from "@/components/onboarding";
import {
  decryptMessage,
  encryptMessage,
  loadBrain,
  newRoomKey,
  publicJwk,
  saveBrain,
  unwrapRoomKey,
  wrapRoomKey,
  type BrainConfig,
} from "@/lib/crypto";
import { chatComplete } from "@/lib/llm";

type OrbState = "idle" | "thinking" | "speaking";
type Line = { id: string; role: "user" | "lyan"; text: string };
type Room = { id: string; title: string };

export function ChatApp({ userEmail }: { userEmail: string | null }) {
  const [brain, setBrain] = useState<BrainConfig | null>(null);
  const [ready, setReady] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomKey, setRoomKey] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [invite, setInvite] = useState("");
  const [agent, setAgent] = useState(true);
  const [auto, setAuto] = useState(true);
  const [online, setOnline] = useState(false);
  const [code, setCode] = useState(false);
  const [state, setState] = useState<OrbState>("idle");
  const [messages, setMessages] = useState<Line[]>([]);
  const [vault, setVault] = useState("");
  const [vaultName, setVaultName] = useState<string | null>(null);
  const [hud, setHud] = useState("0.0 t/s");
  const [title, setTitle] = useState("New task");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadBrain().then((b) => {
      setBrain(b);
      setOnline(Boolean(b?.valid));
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!userEmail || !brain?.onboarded) return;
    refreshRooms();
    const t = window.setInterval(refreshRooms, 20000);
    return () => window.clearInterval(t);
  }, [userEmail, brain?.onboarded]);

  useEffect(() => {
    if (!roomId || !userEmail) return;
    openRoom(roomId);
    const t = window.setInterval(() => openRoom(roomId), 15000);
    return () => window.clearInterval(t);
  }, [roomId, userEmail]);

  const volumes = useMemo(
    () => ({
      idle: { input: 0, output: 0.2 },
      thinking: { input: 0.1, output: 0.45 },
      speaking: { input: 0.2, output: 0.8 },
    }),
    [],
  );

  async function refreshRooms() {
    const res = await fetch("/api/rooms");
    if (!res.ok) return;
    const json = (await res.json()) as { rooms: Room[] };
    setRooms(json.rooms);
    if (!roomId && json.rooms[0]) setRoomId(json.rooms[0].id);
  }

  async function openRoom(id: string) {
    const res = await fetch(`/api/rooms/${id}/messages`);
    if (!res.ok) return;
    const json = await res.json();
    const mine = json.membership as { wrappedKey: string; wrapIv: string; peerPub: string };
    try {
      const key = await unwrapRoomKey(mine.wrappedKey, mine.wrapIv, JSON.parse(mine.peerPub));
      setRoomKey(key);
      const lines: Line[] = [];
      for (const m of json.messages as { id: string; from: string; iv: string; ciphertext: string }[]) {
        const text = await decryptMessage(key, m.iv, m.ciphertext).catch(() => "(undecryptable)");
        lines.push({ id: m.id, role: m.from === userEmail ? "user" : "lyan", text: `${m.from}: ${text}` });
      }
      setMessages(lines);
    } catch {
      setMessages([]);
    }
  }

  async function createTask() {
    const pub = publicJwk();
    if (!pub) return;
    const key = newRoomKey();
    const wrap = await wrapRoomKey(key, pub);
    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, wrappedKey: wrap.wrappedKey, wrapIv: wrap.wrapIv, peerPub: JSON.stringify(pub) }),
    });
    if (!res.ok) return;
    const { id } = (await res.json()) as { id: string };
    setRoomId(id);
    setRoomKey(key);
    refreshRooms();
  }

  async function addPerson() {
    if (!roomId || !roomKey || !invite) return;
    const lookup = await fetch(`/api/users?email=${encodeURIComponent(invite)}`);
    if (!lookup.ok) {
      setHud("User must sign in once");
      return;
    }
    const user = (await lookup.json()) as { publicKey: string };
    const their = JSON.parse(user.publicKey) as JsonWebKey;
    const wrap = await wrapRoomKey(roomKey, their);
    await fetch(`/api/rooms/${roomId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: invite, wrappedKey: wrap.wrappedKey, wrapIv: wrap.wrapIv, peerPub: JSON.stringify(publicJwk()) }),
    });
    await fetch(`/api/rooms/${roomId}/notify`, { method: "POST" });
    if (Notification.permission === "granted") new Notification("Lyan", { body: `Invited ${invite} (no message body)` });
    setInvite("");
  }

  async function postPlain(text: string) {
    if (!roomId || !roomKey) return;
    const enc = await encryptMessage(roomKey, text);
    await fetch(`/api/rooms/${roomId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(enc),
    });
    await fetch(`/api/rooms/${roomId}/notify`, { method: "POST" });
  }

  async function run(prompt: string) {
    if (!prompt || state !== "idle" || !brain) return;
    setDraft("");
    setMessages((current) => [...current, { id: String(Date.now()), role: "user", text: prompt }]);
    await postPlain(prompt);
    setState("thinking");
    const start = performance.now();
    let full: string;
    try {
      if (brain.valid && brain.baseUrl) {
        full = await chatComplete({
          baseUrl: brain.baseUrl,
          apiKey: brain.apiKey,
          model: brain.model,
          messages: [
            { role: "system", content: `Lyan. ${code ? "Code mode." : ""} ${agent ? "Agent." : ""} ${online ? "Online tools allowed on Android." : "Offline."}` },
            { role: "user", content: vault ? `${prompt}\n\nVault:\n${vault.slice(0, 4000)}` : prompt },
          ],
        });
      } else if (brain.mode === "gguf") {
        full = "GGUF is downloaded on Android. On the web, pick BYOK or your own server.";
      } else {
        full = "Add a valid API key in Settings / onboarding, or use a local OpenAI-compatible server.";
      }
    } catch (e) {
      full = String(e);
    }
    setState("speaking");
    const id = String(Date.now() + 1);
    setMessages((current) => [...current, { id, role: "lyan", text: "" }]);
    let built = "";
    const parts = full.split(/(?<=\s)/);
    for (let i = 0; i < parts.length; i++) {
      built += parts[i];
      const elapsed = (performance.now() - start) / 1000;
      setHud(`${(elapsed > 0.05 ? (i + 1) / elapsed : 18).toFixed(1)} t/s`);
      const snapshot = built;
      setMessages((current) => current.map((msg) => (msg.id === id ? { ...msg, text: snapshot } : msg)));
      await wait(10);
    }
    await postPlain(full);
    setState("idle");
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    await run(draft.trim());
  }

  if (!ready) return null;
  if (!brain?.onboarded) {
    return (
      <Onboarding
        userEmail={userEmail}
        onDone={(cfg) => {
          setBrain(cfg);
          setOnline(cfg.valid);
        }}
      />
    );
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">Lyan</div>
        <div className="sub">Tasks · E2E · your brain</div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task name" />
        <button className="navbtn" type="button" onClick={createTask} disabled={!userEmail}>
          New task
        </button>
        {rooms.map((r) => (
          <button key={r.id} className="navbtn" type="button" onClick={() => setRoomId(r.id)}>
            {r.title}
          </button>
        ))}
        <input value={invite} onChange={(e) => setInvite(e.target.value)} placeholder="Add people (email)" />
        <button className="navbtn" type="button" onClick={addPerson} disabled={!roomId}>
          Invite
        </button>
        <a className="navbtn" href="/login">
          {userEmail ?? "Sign in"}
        </a>
        <a className="navbtn" href="https://github.com/zyay/Lyan/releases/tag/latest">
          Android APK
        </a>
        <div className="grow" />
        <button
          className="navbtn"
          type="button"
          onClick={async () => {
            await saveBrain({ ...brain, onboarded: false });
            setBrain({ ...brain, onboarded: false });
          }}
        >
          Redo onboarding
        </button>
        <a className="navbtn" href="/privacy">
          Privacy
        </a>
        <a className="navbtn" href="/terms">
          Terms
        </a>
      </aside>

      <div className="stagewrap">
        <header className="top">
          <strong>{rooms.find((r) => r.id === roomId)?.title ?? "Workspace"}</strong>
          <span className="hud">
            {hud}
            {online ? " · NET" : ""} · {brain.mode}
          </span>
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
              <h1 className="hero">What&apos;s the task?</h1>
              <p className="hint">Teams-style thread. Ciphertext on Vercel. LLM from your URL.</p>
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

        {vaultName && (
          <p className="hint" style={{ textAlign: "center" }}>
            Vault · {vaultName}
          </p>
        )}

        <form onSubmit={onSubmit} className="composer-wrap">
          <BorderBeam size="md" colorVariant="colorful" strength={0.75} theme="dark" active={state !== "thinking"}>
            <div className="composer">
              <textarea className="field" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Build anything." rows={2} />
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
