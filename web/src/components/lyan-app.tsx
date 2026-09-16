"use client";

import { FormEvent, useEffect, useState } from "react";
import { BorderBeam } from "border-beam";
import { ThinkingOrb } from "thinking-orbs";
import { Liquid } from "liquid-gooey";
import { useMicrophone } from "voice-beam";
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
import { chatComplete } from "@/lib/llm";

type Line = { id: string; role: "user" | "lyan"; text: string };
type Room = { id: string; title: string };
type View = "splash" | "meet" | "brain" | "inbox";

const CHIPS = ["This works", "Make it shorter", "Search the web", "Turn this into a checklist"];

export function LyanApp({ userEmail }: { userEmail: string | null }) {
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
  const [sheet, setSheet] = useState<Line | null>(null);
  const [busy, setBusy] = useState(false);
  const [goo, setGoo] = useState(false);
  const mic = useMicrophone();
  const wide = typeof window !== "undefined" && window.innerWidth > 840;

  useEffect(() => {
    loadBrain().then((b) => {
      setBrain(b);
      setView(b?.onboarded ? "inbox" : "splash");
      setReady(true);
    });
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
        lines.push({ id: m.id, role: m.from === userEmail ? "user" : "lyan", text });
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
      setStatus("They must sign in once");
      return;
    }
    const user = (await lookup.json()) as { publicKey: string };
    const wrap = await wrapRoomKey(roomKey, JSON.parse(user.publicKey));
    await fetch(`/api/rooms/${roomId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: invite, wrappedKey: wrap.wrappedKey, wrapIv: wrap.wrapIv, peerPub: JSON.stringify(publicJwk()) }),
    });
    if (Notification.permission === "granted") new Notification("Lyan", { body: `New activity in ${title}` });
    setInvite("");
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
    setDraft("");
    const userLine = { id: String(Date.now()), role: "user" as const, text: prompt };
    setMessages((m) => [...m, userLine]);
    await postPlain(prompt);
    setBusy(true);
    let full: string;
    try {
      if (brain.valid && brain.baseUrl) {
        full = await chatComplete({
          baseUrl: brain.baseUrl,
          apiKey: brain.apiKey,
          model: brain.model,
          messages: [
            { role: "system", content: "You are Lyan, a personal employee. Be concise and useful." },
            { role: "user", content: prompt },
          ],
        });
      } else if (brain.mode === "gguf") {
        full = "GGUF lives on Android (Models). On the web, add a BYOK URL.";
      } else {
        full = "Add a valid API key in Create My Own, or start a local OpenAI-compatible server.";
      }
    } catch (e) {
      full = String(e);
    }
    setMessages((m) => [...m, { id: String(Date.now() + 1), role: "lyan", text: full }]);
    await postPlain(full);
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
            <h1>Lyan</h1>
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
            <div className="avatar-sm">{(userEmail ?? "L")[0]!.toUpperCase()}</div>
            <h2>Lyan</h2>
            <button className="iconbtn" type="button" onClick={() => setView("brain")}>⚙</button>
            <button className="iconbtn" type="button" onClick={() => { setTitle("New task"); createTask(); }}>+</button>
          </div>
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
            </div>
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
                <p key={m.id} className={m.role === "user" ? "msg user" : "msg"} onContextMenu={(e) => { e.preventDefault(); setSheet(m); }}>
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
                    <Liquid.Item x={0} y={-44} transition="bouncy">
                      <button className="plus" type="button" onClick={() => void mic.start()}>
                        mic
                      </button>
                    </Liquid.Item>
                  )}
                </Liquid>
              </div>
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
      </div>
    </div>
  );
}
