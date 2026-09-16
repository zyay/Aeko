"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { BorderBeam } from "border-beam";
import { ThinkingOrb } from "thinking-orbs";
import { Liquid } from "liquid-gooey";
import { useMicrophone } from "@/vendor/voice-beam";
import { DynImage, DynVoice, DynStrobi } from "@/components/dyn-fx";
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
import { streamChat } from "@/lib/llm";
import { httpFetch, webSearch } from "@/lib/web-tools";

type Line = { id: string; role: "user" | "aeko" | "tool"; text: string };
type Room = { id: string; title: string };
type View = "splash" | "meet" | "brain" | "inbox";

const CHIPS = ["This works", "Make it shorter", "Search the web", "Turn this into a checklist"];

export function AekoApp({ userEmail }: { userEmail: string | null }) {
  const [brain, setBrain] = useState<BrainConfig | null>(null);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<View>("splash");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomKey, setRoomKey] = useState<string | null>(null);
  const [members, setMembers] = useState<string[]>([]);
  const [messages, setMessages] = useState<Line[]>([]);
  const [draft, setDraft] = useState("");
  const [invite, setInvite] = useState("");
  const [title, setTitle] = useState("Signal Monitor");
  const [status, setStatus] = useState("");
  const [durable, setDurable] = useState<boolean | null>(null);
  const [sheet, setSheet] = useState<Line | null>(null);
  const [busy, setBusy] = useState(false);
  const [goo, setGoo] = useState(false);
  const [vault, setVault] = useState("");
  const [vaultName, setVaultName] = useState("");
  const [codeMode, setCodeMode] = useState(false);
  const [agentMode, setAgentMode] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const mic = useMicrophone();
  const wide = typeof window !== "undefined" && window.innerWidth > 840;

  useEffect(() => {
    loadBrain().then((b) => {
      setBrain(b);
      setView(b?.onboarded ? "inbox" : "splash");
      setReady(true);
    });
    fetch("/api/health")
      .then((r) => r.json() as Promise<{ durable?: boolean; db?: string }>)
      .then((j) => setDurable(Boolean(j.durable) || j.db === "postgres"))
      .catch(() => setDurable(null));
  }, []);

  useEffect(() => {
    if (!userEmail || view === "splash" || view === "meet" || view === "brain") return;
    refreshRooms();
    const t = window.setInterval(refreshRooms, 20000);
    return () => window.clearInterval(t);
  }, [userEmail, view]);

  useEffect(() => {
    if (!roomId || !userEmail) return;
    openRoom(roomId);
    const t = window.setInterval(() => openRoom(roomId), 15000);
    return () => window.clearInterval(t);
  }, [roomId, userEmail]);

  useEffect(() => {
    if (!userEmail) return;
    void subscribePush();
  }, [userEmail]);

  async function refreshRooms() {
    const res = await fetch("/api/rooms");
    if (!res.ok) return;
    const json = (await res.json()) as { rooms: Room[] };
    setRooms(json.rooms);
  }

  async function openRoom(id: string) {
    const res = await fetch(`/api/rooms/${id}/messages`);
    if (!res.ok) return;
    const json = await res.json();
    const mine = json.membership as { wrappedKey: string; wrapIv: string; peerPub: string };
    try {
      const key = await unwrapRoomKey(mine.wrappedKey, mine.wrapIv, JSON.parse(mine.peerPub));
      setRoomKey(key);
      setMembers((json.members as { email: string }[]).map((m) => m.email));
      const lines: Line[] = [];
      for (const m of json.messages as { id: string; from: string; iv: string; ciphertext: string }[]) {
        const text = await decryptMessage(key, m.iv, m.ciphertext).catch(() => "(undecryptable)");
        lines.push({ id: m.id, role: m.from === userEmail ? "user" : "aeko", text });
      }
      setMessages(lines);
    } catch {
      setMessages([]);
    }
  }

  async function createTask() {
    const pub = publicJwk();
    if (!pub || !userEmail) {
      setRooms((r) => (r.some((x) => x.id === "local") ? r : [{ id: "local", title }, ...r]));
      setRoomId("local");
      return;
    }
    const key = newRoomKey();
    const wrap = await wrapRoomKey(key, pub);
    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, wrappedKey: wrap.wrappedKey, wrapIv: wrap.wrapIv, peerPub: JSON.stringify(pub) }),
    });
    if (!res.ok) {
      setStatus(`Could not create task (${res.status})`);
      return;
    }
    const { id } = (await res.json()) as { id: string };
    setRoomId(id);
    setRoomKey(key);
    refreshRooms();
  }

  async function addPerson() {
    if (!roomId || !roomKey || !invite) return;
    const lookup = await fetch(`/api/users?email=${encodeURIComponent(invite)}`);
    if (!lookup.ok) {
      setStatus("They must sign in once");
      return;
    }
    const user = (await lookup.json()) as { publicKey: string };
    const wrap = await wrapRoomKey(roomKey, JSON.parse(user.publicKey));
    const memberRes = await fetch(`/api/rooms/${roomId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: invite, wrappedKey: wrap.wrappedKey, wrapIv: wrap.wrapIv, peerPub: JSON.stringify(publicJwk()) }),
    });
    if (!memberRes.ok) {
      setStatus(`Invite failed (${memberRes.status})`);
      return;
    }
    await fetch(`/api/rooms/${roomId}/notify`, { method: "POST" });
    setInvite("");
    setStatus(`Invited ${invite}`);
  }

  async function subscribePush() {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
      const vapid = await fetch("/api/push").then((r) => r.json() as Promise<{ publicKey: string }>);
      if (!vapid.publicKey) {
        setStatus("Web Push needs AEKO_VAPID_PUBLIC / AEKO_VAPID_PRIVATE");
        return;
      }
      const reg = await navigator.serviceWorker.register("/aeko-sw.js");
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid.publicKey),
      });
      const json = sub.toJSON();
      const res = await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });
      if (!res.ok) setStatus(`Push subscribe failed (${res.status})`);
    } catch (e) {
      setStatus(String(e));
    }
  }

  async function postPlain(text: string) {
    if (!roomId || !roomKey || roomId === "local") return;
    const enc = await encryptMessage(roomKey, text);
    await fetch(`/api/rooms/${roomId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(enc),
    });
    await fetch(`/api/rooms/${roomId}/notify`, { method: "POST" });
  }

  async function run(prompt: string) {
    if (!prompt || busy || !brain) return;
    const text = codeMode && !prompt.toLowerCase().includes("code") ? `Code Mode. ${prompt}` : prompt;
    setDraft("");
    const userLine = { id: String(Date.now()), role: "user" as const, text };
    setMessages((m) => [...m, userLine]);
    await postPlain(text);
    setBusy(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const traces: string[] = [];
    try {
      if (text.toLowerCase().includes("search") || text.toLowerCase().includes("look up")) {
        const note = await webSearch(text).catch((e) => `web_search:\n${String(e)}`);
        traces.push(note);
        setMessages((m) => [...m, { id: `${Date.now()}-t`, role: "tool", text: note }]);
      }
      const url = text.match(/https:\/\/[^\s]+/)?.[0];
      if (url) {
        const note = await httpFetch(url).catch((e) => `http_fetch:\n${String(e)}`);
        traces.push(note);
        setMessages((m) => [...m, { id: `${Date.now()}-f`, role: "tool", text: note }]);
      }
      const aekoId = String(Date.now() + 1);
      setMessages((m) => [...m, { id: aekoId, role: "aeko", text: "" }]);
      let full = "";
      const system = `You are Aeko, a personal employee. Be concise.${agentMode ? " Agent mode." : ""}${vault ? " Prefer the attached vault." : ""}`;
      const user = [text, vault ? `Vault:\n${vault.slice(0, 4000)}` : "", traces.length ? `Tool results:\n${traces.join("\n\n")}` : ""]
        .filter(Boolean)
        .join("\n\n");
      if (brain.valid && brain.baseUrl) {
        full = await streamChat({
          baseUrl: brain.baseUrl,
          apiKey: brain.apiKey,
          model: brain.model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          signal: ctrl.signal,
          onDelta: (chunk) => {
            setMessages((m) => m.map((line) => (line.id === aekoId ? { ...line, text: line.text + chunk } : line)));
          },
        });
      } else if (brain.mode === "gguf") {
        full = "GGUF lives on Android (Models). On the web, add a BYOK URL.";
        setMessages((m) => m.map((line) => (line.id === aekoId ? { ...line, text: full } : line)));
      } else {
        full = "Add a valid API key in Create My Own, or start a local OpenAI-compatible server.";
        setMessages((m) => m.map((line) => (line.id === aekoId ? { ...line, text: full } : line)));
      }
      await postPlain(full);
    } catch (e) {
      const err = String(e);
      setMessages((m) => [...m, { id: String(Date.now() + 2), role: "aeko", text: err }]);
      await postPlain(err);
    }
    abortRef.current = null;
    setBusy(false);
  }

  async function finishBrain(next: BrainConfig) {
    const pub = await (await import("@/lib/crypto")).generateIdentity();
    await fetch("/api/me/keys", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicKey: JSON.stringify(pub) }),
    }).catch(() => {});
    const saved = { ...next, onboarded: true };
    await saveBrain(saved);
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      await Notification.requestPermission();
    }
    setBrain(saved);
    setView("inbox");
  }

  if (!ready) return null;

  if (view === "splash") {
    return (
      <div className="phone-shell">
        <div className="phone splash">
          <Top />
          <DynImage
            preset="pixels-organic"
            theme="light"
            images={["/agents/a.svg", "/agents/b.svg"]}
            autoReveal
            className="splash-fx"
          >
            <div className="splash-canvas" />
          </DynImage>
          <Liquid blur={6} contrast={18} fill="#fff" shadow="0 2px 6px rgba(0,0,0,.08)" className="splash-goo">
            <Liquid.Item x={-70} y={40} transition="bouncy">
              <div className="round-orb">
                <ThinkingOrb state="breathing" size={64} theme="light" />
              </div>
            </Liquid.Item>
            <Liquid.Item x={80} y={-20} transition="bouncy" delay={40}>
              <div className="round-orb">
                <ThinkingOrb state="searching" size={64} theme="light" />
              </div>
            </Liquid.Item>
            <Liquid.Item x={-20} y={120} transition="bouncy" delay={80}>
              <div className="round-orb">
                <ThinkingOrb state="weaving" size={64} theme="light" />
              </div>
            </Liquid.Item>
          </Liquid>
          <div className="splash-mascot">
            <DynStrobi animation="sleeping" size={180} />
          </div>
          <div className="splash-copy">
            <h1>Aeko</h1>
            <p>Your team of always-on agents that finish the work.</p>
          </div>
          <a className="signpill" href="/login">
            Sign in
          </a>
          <button className="ghostlink" type="button" onClick={() => setView("meet")}>
            Continue local-only
          </button>
        </div>
      </div>
    );
  }

  if (view === "meet") {
    return (
      <div className="phone-shell">
        <div className="phone meet">
          <Top />
          <h1>Meet Your First Bot</h1>
          <div className="meet-hero">
            <DynStrobi animation="idle" size={220} />
            <h2>Signal Monitor</h2>
            <p className="sub">Watches sites, dashboards, and feeds for changes — then writes the brief.</p>
          </div>
          <div className="meet-actions">
            <button className="blackpill" type="button" onClick={() => { setTitle("Signal Monitor"); finishBrain(brain ?? emptyBrain()); }}>
              Start Chat
            </button>
            <button className="ghostlink" type="button" onClick={() => setView("brain")}>
              Create My Own
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "brain") {
    return (
      <BrainForm
        userEmail={userEmail}
        initial={brain}
        onBack={() => setView("meet")}
        onDone={finishBrain}
        status={status}
        setStatus={setStatus}
      />
    );
  }

  const current = rooms.find((r) => r.id === roomId)?.title ?? title;
  const showInbox = !roomId || (typeof window !== "undefined" && window.innerWidth > 840);
  const showThread = Boolean(roomId);

  return (
    <div className="phone-shell">
      <div className={wide || (typeof window !== "undefined" && window.innerWidth > 840) ? "workspace" : "phone"}>
        <aside className={`inbox ${showThread && typeof window !== "undefined" && window.innerWidth <= 840 ? "hidden-mobile" : ""}`}>
          <Top />
          <div className="inbox-head">
            <div className="avatar-sm">{(userEmail ?? "A")[0]!.toUpperCase()}</div>
            <h2>Aeko</h2>
            <button className="iconbtn" type="button" onClick={() => setView("brain")}>⚙</button>
            <button className="iconbtn" type="button" onClick={() => { setTitle("New task"); createTask(); }}>+</button>
          </div>
          {durable === false && (
            <p className="tiny">Rooms are not durable yet. Attach Neon DATABASE_URL on Vercel so /api/health shows postgres.</p>
          )}
          {status && <p className="tiny">{status}</p>}
          <input className="field taskname" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task name" />
          {(rooms.length ? rooms : [{ id: "local", title: "Signal Monitor" }]).map((r, i) => (
          <button key={r.id} className={r.id === roomId ? "taskrow on" : "taskrow"} type="button" onClick={() => setRoomId(r.id)}>
              <ThinkingOrb
                state={(["breathing", "searching", "working", "composing", "listening"] as const)[i % 5]}
                size={64}
                theme="light"
              />
              <div>
                <div className="title">
                  {r.title} <span className="meta">Task</span>
                </div>
                <div className="preview">{messages[0]?.text.slice(0, 72) || "Tap to open the thread"}</div>
              </div>
              <div className="time">now</div>
            </button>
          ))}
        </aside>
        {(showThread || (typeof window !== "undefined" && window.innerWidth > 840)) && (
          <section className={`thread ${!roomId && typeof window !== "undefined" && window.innerWidth <= 840 ? "hidden-mobile" : ""}`}>
            <Top />
            <div className="thread-head">
              <button className="iconbtn" type="button" onClick={() => setRoomId(null)}>←</button>
              <DynStrobi animation={busy ? "thinking" : "idle"} size={48} />
              <strong>{current}</strong>
              {busy && (
                <button className="ghostlink" type="button" onClick={() => abortRef.current?.abort()}>
                  Stop
                </button>
              )}
            </div>
            {(vaultName || codeMode || agentMode) && (
              <div className="people">
                {vaultName ? <span>Vault · {vaultName}</span> : null}
                <button type="button" className="chip" onClick={() => setCodeMode((v) => !v)}>
                  {codeMode ? "Code on" : "Code"}
                </button>
                <button type="button" className="chip" onClick={() => setAgentMode((v) => !v)}>
                  {agentMode ? "Agent on" : "Agent"}
                </button>
              </div>
            )}
            {members.length > 0 && (
              <div className="people">
                {members.map((m) => (
                  <span key={m}>{m}</span>
                ))}
              </div>
            )}
            <div className="thread-body">
              {messages.length === 0 && (
                <p className="msg">Want me to start this task, or is this the shape of week you wanted?</p>
              )}
              {messages.map((m) => (
                <p key={m.id} className={m.role === "user" ? "msg user" : m.role === "tool" ? "msg tool" : "msg"} onContextMenu={(e) => { e.preventDefault(); setSheet(m); }}>
                  {m.text}
                </p>
              ))}
            </div>
            <div className="chips">
              {CHIPS.map((c) => (
                <button key={c} className="chip" type="button" onClick={() => run(c)}>
                  {c}
                </button>
              ))}
            </div>
            <form
              className="composer"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                run(draft.trim());
              }}
            >
              <div className="goo-wrap">
                <Liquid blur={6} contrast={18} fill="#f3f3f4">
                  <Liquid.Item x={0} y={0}>
                    <button className="plus" type="button" onClick={() => setGoo((v) => !v)}>
                      +
                    </button>
                  </Liquid.Item>
                  {goo && (
                    <>
                    <Liquid.Item x={0} y={-44} transition="bouncy">
                      <button className="plus" type="button" onClick={() => void mic.start()}>
                        mic
                      </button>
                    </Liquid.Item>
                    <Liquid.Item x={0} y={-88} transition="bouncy">
                      <button className="plus" type="button" onClick={() => document.getElementById("vault-file")?.click()}>
                        file
                      </button>
                    </Liquid.Item>
                    </>
                  )}
                </Liquid>
              </div>
              <input
                id="vault-file"
                type="file"
                hidden
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setVaultName(file.name);
                  setVault(await file.text());
                }}
              />
              <DynVoice stream={mic.stream} processing={busy} theme="light" type="default" colorVariant="colorful">
                <BorderBeam size="md" colorVariant="colorful" strength={0.65} theme="light" active={!busy}>
                  <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Ask ${current}`} />
                </BorderBeam>
              </DynVoice>
            </form>
            {userEmail && (
              <div className="invitebar">
                <input className="field" value={invite} onChange={(e) => setInvite(e.target.value)} placeholder="Add people (email)" />
                <button className="blackpill" type="button" onClick={addPerson}>
                  Invite
                </button>
              </div>
            )}
            {sheet && (
              <div className="sheet-bg" onClick={() => setSheet(null)}>
                <div className="sheet" onClick={(e) => e.stopPropagation()}>
                  <div className="reacts">
                    {["❤️", "🙌", "😂", "😮", "😢", "😡"].map((e) => (
                      <button key={e} type="button">{e}</button>
                    ))}
                  </div>
                  <button className="row" type="button" onClick={() => { navigator.clipboard.writeText(sheet.text); setSheet(null); }}>
                    Reply
                  </button>
                  <button className="row" type="button">Start a thread</button>
                  <button className="row" type="button" onClick={() => setSheet(null)}>Mark as unread</button>
                  <button className="row" type="button" onClick={() => { navigator.clipboard.writeText(sheet.text); setSheet(null); }}>
                    Copy
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function Top() {
  return (
    <div className="hl-bar">
      <span>
        <i className="hl-dot" />
        Highlight
      </span>
      <span>9:41</span>
    </div>
  );
}

function emptyBrain(): BrainConfig {
  return {
    mode: "byok",
    baseUrl: "",
    apiKey: "",
    model: "gpt-4o-mini",
    proxyViaVercel: false,
    valid: false,
    onboarded: true,
  };
}

function BrainForm({
  userEmail,
  initial,
  onBack,
  onDone,
  status,
  setStatus,
}: {
  userEmail: string | null;
  initial: BrainConfig | null;
  onBack: () => void;
  onDone: (cfg: BrainConfig) => void;
  status: string;
  setStatus: (s: string) => void;
}) {
  const [cfg, setCfg] = useState<BrainConfig>(
    initial ?? {
      mode: "byok",
      baseUrl: "https://api.openai.com/v1",
      apiKey: "",
      model: "gpt-4o-mini",
      proxyViaVercel: false,
      valid: false,
      onboarded: false,
    },
  );

  return (
    <div className="phone-shell">
      <div className="phone meet">
        <Top />
        <button className="back" type="button" onClick={onBack}>← Back</button>
        <h1>Create My Own</h1>
        <p className="sub">{userEmail ? `Signed in as ${userEmail}` : "Local brain — keys stay in this browser."}</p>
        <div className="cards">
          <button className={cfg.mode === "byok" ? "cardbtn on" : "cardbtn"} type="button" onClick={() => setCfg({ ...cfg, mode: "byok", baseUrl: "https://api.openai.com/v1" })}>
            API key + URL<span>OpenAI, Groq, OpenRouter, LM Studio</span>
          </button>
          <button className={cfg.mode === "server" ? "cardbtn on" : "cardbtn"} type="button" onClick={() => setCfg({ ...cfg, mode: "server", baseUrl: "http://127.0.0.1:11434/v1" })}>
            Own server<span>Any OpenAI-compatible /v1</span>
          </button>
          <button className={cfg.mode === "gguf" ? "cardbtn on" : "cardbtn"} type="button" onClick={() => setCfg({ ...cfg, mode: "gguf" })}>
            Download GGUF<span>On Android · Models</span>
          </button>
        </div>
        {cfg.mode !== "gguf" && (
          <>
            <input className="field" value={cfg.baseUrl} onChange={(e) => setCfg({ ...cfg, baseUrl: e.target.value })} placeholder="Base URL" />
            <input className="field" type="password" value={cfg.apiKey} onChange={(e) => setCfg({ ...cfg, apiKey: e.target.value })} placeholder="API key" />
            <input className="field" value={cfg.model} onChange={(e) => setCfg({ ...cfg, model: e.target.value })} placeholder="Model" />
            <button
              className="cardbtn"
              type="button"
              onClick={async () => {
                setStatus("Testing…");
                const { testBrain } = await import("@/lib/llm");
                try {
                  const ok = await testBrain(cfg.baseUrl, cfg.apiKey, cfg.model);
                  setCfg((c) => ({ ...c, valid: ok }));
                  setStatus(ok ? "Key valid. Tools stay on." : "Reached endpoint.");
                } catch (e) {
                  setStatus(String(e));
                }
              }}
            >
              Test key
            </button>
          </>
        )}
        <p className="tiny">{status}</p>
        <p className="tiny">Keys stay on this device. Vercel stores ciphertext rooms only. Notifications never include the message.</p>
        <button className="blackpill" type="button" onClick={() => onDone(cfg)}>
          Open workspace
        </button>
        {userEmail && (
          <a className="ghostlink" href="/api/auth/signout">
            Sign out
          </a>
        )}
      </div>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
