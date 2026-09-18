"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { ThinkingOrb } from "thinking-orbs";
import { DynStrobi } from "@/components/dyn-fx";
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
import {
  AppFooter,
  IconAttach,
  IconBack,
  IconFile,
  IconMic,
  IconPlus,
  IconSend,
  IconSettings,
  MessageRow,
} from "@/components/ui-primitives";

type Line = { id: string; role: "user" | "aeko" | "tool"; text: string; at?: number };
type Room = { id: string; title: string; lastAt?: number; messageCount?: number };
type RoomPreview = { text: string; lastAt: number };
type View = "splash" | "meet" | "brain" | "inbox";

const CHIPS = ["This works", "Make it shorter", "Search the web", "Turn this into a checklist"];

function formatTime(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  const diff = now.getTime() - d.getTime();
  if (diff < 7 * 86400000) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function useMediaQuery(query: string) {
  const [match, setMatch] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return match;
}

function useSpeech(onText: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const start = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return false;
    const rec = new Ctor();
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e: { results: ArrayLike<{ 0: { transcript: string } }> }) => {
      const text = e.results[0]?.[0]?.transcript ?? "";
      if (text) onText(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
    setListening(true);
    return true;
  }, [onText]);
  return { listening, start };
}

export function AekoApp({ userEmail }: { userEmail: string | null }) {
  const wide = useMediaQuery("(min-width: 841px)");
  const [brain, setBrain] = useState<BrainConfig | null>(null);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<View>("splash");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [previews, setPreviews] = useState<Record<string, RoomPreview>>({});
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
  const [vault, setVault] = useState("");
  const [vaultName, setVaultName] = useState("");
  const [codeMode, setCodeMode] = useState(false);
  const [agentMode, setAgentMode] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [filter, setFilter] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const speech = useSpeech((text) => setDraft((d) => (d ? `${d} ${text}` : text)));

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
    if (!userEmail || view !== "inbox") return;
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

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function refreshRooms() {
    const res = await fetch("/api/rooms");
    if (!res.ok) return;
    const json = (await res.json()) as { rooms: Room[] };
    setRooms(json.rooms);
    setPreviews((prev) => {
      const next = { ...prev };
      for (const r of json.rooms) {
        if (r.lastAt && !next[r.id]) next[r.id] = { text: "", lastAt: r.lastAt };
        else if (r.lastAt) next[r.id] = { ...next[r.id]!, lastAt: r.lastAt };
      }
      return next;
    });
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
      const raw = json.messages as { id: string; from: string; iv: string; ciphertext: string; createdAt?: number }[];
      const lines: Line[] = [];
      for (const m of raw) {
        const text = await decryptMessage(key, m.iv, m.ciphertext).catch(() => "(undecryptable)");
        lines.push({ id: m.id, role: m.from === userEmail ? "user" : "aeko", text, at: m.createdAt });
      }
      setMessages(lines);
      const last = lines[lines.length - 1];
      if (last) {
        setPreviews((p) => ({
          ...p,
          [id]: { text: last.text.slice(0, 120), lastAt: last.at ?? Date.now() },
        }));
      }
    } catch {
      setMessages([]);
    }
  }

  async function createTask(): Promise<{ id: string; key: string } | null> {
    const pub = publicJwk();
    if (!pub || !userEmail) {
      setStatus("Sign in to create synced tasks");
      return null;
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
      return null;
    }
    const { id } = (await res.json()) as { id: string };
    setRoomId(id);
    setRoomKey(key);
    setMessages([]);
    setStatus("");
    refreshRooms();
    return { id, key };
  }

  async function addPerson() {
    if (!roomId || !roomKey || !invite.trim()) return;
    const email = invite.trim().toLowerCase();
    const lookup = await fetch(`/api/users?email=${encodeURIComponent(email)}`);
    if (!lookup.ok) {
      setStatus("They must sign in once before you can invite them");
      return;
    }
    const user = (await lookup.json()) as { publicKey: string };
    const wrap = await wrapRoomKey(roomKey, JSON.parse(user.publicKey));
    const memberRes = await fetch(`/api/rooms/${roomId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, wrappedKey: wrap.wrappedKey, wrapIv: wrap.wrapIv, peerPub: JSON.stringify(publicJwk()) }),
    });
    if (!memberRes.ok) {
      setStatus(`Invite failed (${memberRes.status})`);
      return;
    }
    await fetch(`/api/rooms/${roomId}/notify`, { method: "POST" });
    setInvite("");
    setStatus(`Invited ${email}`);
    setMembers((m) => [...new Set([...m, email])]);
  }

  async function subscribePush() {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
      const vapid = await fetch("/api/push").then((r) => r.json() as Promise<{ publicKey: string }>);
      if (!vapid.publicKey) return;
      const reg = await navigator.serviceWorker.register("/aeko-sw.js");
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid.publicKey),
      });
      const json = sub.toJSON();
      await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });
    } catch {
      /* optional */
    }
  }

  async function postPlain(text: string, rid = roomId, key = roomKey) {
    if (!rid || !key || !text.trim()) return;
    const enc = await encryptMessage(key, text);
    await fetch(`/api/rooms/${rid}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(enc),
    });
    await fetch(`/api/rooms/${rid}/notify`, { method: "POST" });
    setPreviews((p) => ({
      ...p,
      [rid]: { text: text.slice(0, 120), lastAt: Date.now() },
    }));
  }

  async function run(prompt: string) {
    if (!prompt || busy || !brain) return;
    let activeRoomId = roomId;
    let activeKey = roomKey;
    if (!activeRoomId || !activeKey) {
      const created = await createTask();
      if (!created) return;
      activeRoomId = created.id;
      activeKey = created.key;
    }
    const text = codeMode && !prompt.toLowerCase().includes("code") ? `Code Mode. ${prompt}` : prompt;
    setDraft("");
    const userLine = { id: String(Date.now()), role: "user" as const, text, at: Date.now() };
    setMessages((m) => [...m, userLine]);
    await postPlain(text, activeRoomId, activeKey);
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
        full = "GGUF runs on Android (Models screen). On web, add a BYOK URL in settings.";
        setMessages((m) => m.map((line) => (line.id === aekoId ? { ...line, text: full } : line)));
      } else {
        full = "Add a valid API key in Settings, or start a local OpenAI-compatible server.";
        setMessages((m) => m.map((line) => (line.id === aekoId ? { ...line, text: full } : line)));
      }
      await postPlain(full, activeRoomId, activeKey);
      refreshRooms();
    } catch (e) {
      const err = String(e);
      setMessages((m) => [...m, { id: String(Date.now() + 2), role: "aeko", text: err }]);
      await postPlain(err, activeRoomId, activeKey);
    }
    abortRef.current = null;
    setBusy(false);
  }

  function replyTo(line: Line) {
    setDraft((d) => (d ? `${d}\n> ${line.text.slice(0, 200)}\n` : `> ${line.text.slice(0, 200)}\n`));
    setSheet(null);
  }

  function regenerateFrom(line: Line) {
    const idx = messages.findIndex((m) => m.id === line.id);
    if (idx <= 0) return;
    for (let i = idx - 1; i >= 0; i--) {
      if (messages[i]!.role === "user") {
        setSheet(null);
        run(messages[i]!.text);
        return;
      }
    }
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
      <div className="aeko-root onboard">
        <span className="onboard-badge">Encrypted · BYOK · Real LLM</span>
        <div className="onboard-hero">
          <DynStrobi animation="sleeping" size={180} />
        </div>
        <h1>Aeko</h1>
        <p>Your team of always-on agents that finish the work — synced rooms, on-device keys, no mock UI.</p>
        <div className="onboard-actions">
          <a className="signpill" href="/login">
            Sign in
          </a>
          <button className="ghostlink" type="button" onClick={() => setView("meet")}>
            Continue without account
          </button>
        </div>
        <AppFooter />
      </div>
    );
  }

  if (view === "meet") {
    return (
      <div className="aeko-root onboard">
        <div className="meet">
          <div className="onboard-hero">
            <DynStrobi animation="idle" size={180} />
          </div>
          <h1>Meet Your First Bot</h1>
          <p className="sub">Signal Monitor watches feeds and dashboards, then writes the brief.</p>
          <div className="onboard-actions">
            <button
              className="blackpill"
              type="button"
              onClick={() => {
                setTitle("Signal Monitor");
                finishBrain(brain ?? emptyBrain());
              }}
            >
              Start workspace
            </button>
            <button className="ghostlink" type="button" onClick={() => setView("brain")}>
              Configure brain (API key / server)
            </button>
          </div>
          <AppFooter />
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
  const showInbox = wide || !roomId;
  const showThread = wide || Boolean(roomId);
  const brainLabel = brain?.valid ? "Connected" : brain?.mode === "gguf" ? "GGUF (Android)" : "Needs key";
  const userLabel = (userEmail ?? "You").split("@")[0] ?? "You";
  const filteredRooms = rooms.filter((r) => !filter || r.title.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="aeko-root">
      <div className={`aeko-shell ${!wide ? "single" : ""}`}>
        <aside className={`inbox ${!showInbox ? "hidden-mobile" : ""}`}>
          <div className="inbox-head">
            <div className="avatar-sm">{(userEmail ?? "A")[0]!.toUpperCase()}</div>
            <h2>Aeko</h2>
            <button className="iconbtn" type="button" aria-label="Settings" onClick={() => setView("brain")}>
              <IconSettings />
            </button>
            <button
              className="iconbtn"
              type="button"
              aria-label="New task"
              onClick={() => {
                setTitle(`Task ${rooms.length + 1}`);
                createTask();
              }}
            >
              <IconPlus />
            </button>
          </div>
          <div className="inbox-meta">
            {durable === false && (
              <p className="banner-warn">Rooms are local-only until Neon DATABASE_URL is attached on Vercel.</p>
            )}
            {status && <p className="tiny">{status}</p>}
            {!userEmail && <p className="tiny"><a href="/login">Sign in</a> to sync tasks across devices.</p>}
          </div>
          <div className="inbox-new">
            <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New task name" />
            {rooms.length > 0 && (
              <div className="inbox-search">
                <input className="field" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search tasks…" />
              </div>
            )}
          </div>
          <div className="inbox-list">
            {rooms.length === 0 ? (
              <div className="empty-panel">
                <div className="onboard-hero">
                  <DynStrobi animation="idle" size={100} />
                </div>
                <p>No tasks yet. Name one above, tap +, or configure your brain in Settings.</p>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="inbox-empty">No tasks match &ldquo;{filter}&rdquo;</div>
            ) : (
              filteredRooms.map((r, i) => {
                const preview = previews[r.id]?.text || (r.messageCount ? `${r.messageCount} messages` : "Tap to open");
                const lastAt = previews[r.id]?.lastAt ?? r.lastAt ?? 0;
                return (
                  <button key={r.id} className={r.id === roomId ? "taskrow on" : "taskrow"} type="button" onClick={() => setRoomId(r.id)}>
                    <div className="task-orb">
                      <ThinkingOrb state={(["breathing", "searching", "working", "composing", "listening"] as const)[i % 5]} size={64} theme="light" />
                    </div>
                    <div>
                      <div className="title">
                        {r.title} <span className="meta">Task</span>
                      </div>
                      <div className="preview">{preview}</div>
                    </div>
                    <div className="time">{lastAt ? formatTime(lastAt) : ""}</div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {showThread && (
          <section className={`thread ${!roomId && !wide ? "hidden-mobile" : ""}`}>
            {!roomId ? (
              <div className="empty-panel">
                <div className="onboard-hero">
                  <DynStrobi animation="idle" size={120} />
                </div>
                <p>Select a task from the inbox, or create a new one to start working with Aeko.</p>
              </div>
            ) : (
              <>
                <div className="thread-head">
                  {!wide && (
                    <button className="iconbtn" type="button" aria-label="Back" onClick={() => setRoomId(null)}>
                      <IconBack />
                    </button>
                  )}
                  <DynStrobi animation={busy ? "thinking" : "idle"} size={44} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong>{current}</strong>
                    <div className="thread-head-meta">{brainLabel} · {busy ? "Generating" : "Ready"}</div>
                  </div>
                  {busy && (
                    <button className="ghostlink" type="button" onClick={() => abortRef.current?.abort()}>
                      Stop
                    </button>
                  )}
                </div>
                <div className="thread-status">
                  <span className="status-pill">
                    <i className={`dot ${busy ? "busy" : ""}`} />
                    {busy ? "Generating…" : "Ready"}
                  </span>
                  <span className="status-pill">Brain: {brainLabel}</span>
                  {vaultName && <span className="status-pill">Vault: {vaultName}</span>}
                </div>
                <div className="toolbar">
                  <button type="button" className={codeMode ? "chip on" : "chip"} onClick={() => setCodeMode((v) => !v)}>
                    {codeMode ? "Code on" : "Code"}
                  </button>
                  <button type="button" className={agentMode ? "chip on" : "chip"} onClick={() => setAgentMode((v) => !v)}>
                    {agentMode ? "Agent on" : "Agent"}
                  </button>
                </div>
                {members.length > 0 && (
                  <div className="people">
                    {members.map((m) => (
                      <span key={m}>{m}</span>
                    ))}
                  </div>
                )}
                <div className="thread-body" ref={bodyRef}>
                  {messages.length === 0 && (
                    <div className="empty-panel">
                      <p>Ask anything to start — search the web, write code, or attach a vault file below.</p>
                    </div>
                  )}
                  {messages.map((m) => (
                    <MessageRow
                      key={m.id}
                      line={m}
                      busy={busy}
                      userLabel={userLabel}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setSheet(m);
                      }}
                    />
                  ))}
                </div>
                <div className="chips">
                  {CHIPS.map((c) => (
                    <button key={c} className="chip" type="button" onClick={() => run(c)}>
                      {c}
                    </button>
                  ))}
                </div>
                <div className="composer-wrap">
                <form
                  className="composer"
                  onSubmit={(e: FormEvent) => {
                    e.preventDefault();
                    run(draft.trim());
                  }}
                >
                  <div className="composer-tools">
                    <button type="button" aria-label="Attach" onClick={() => setShowAttach((v) => !v)}>
                      <IconAttach />
                    </button>
                    {showAttach && (
                      <>
                        <button
                          type="button"
                          className={speech.listening ? "on" : ""}
                          aria-label="Voice"
                          onClick={() => {
                            if (!speech.start()) setStatus("Speech recognition not supported in this browser");
                          }}
                        >
                          <IconMic />
                        </button>
                        <button type="button" aria-label="File" onClick={() => document.getElementById("vault-file")?.click()}>
                          <IconFile />
                        </button>
                      </>
                    )}
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
                      setShowAttach(false);
                    }}
                  />
                  <div className="composer-input">
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder={`Message ${current}`}
                      rows={1}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          run(draft.trim());
                        }
                      }}
                    />
                  </div>
                  <button className="sendbtn" type="submit" disabled={!draft.trim() || busy} aria-label="Send">
                    <IconSend />
                  </button>
                </form>
                </div>
                {userEmail && roomId && (
                  <div className="invitebar">
                    <input className="field" value={invite} onChange={(e) => setInvite(e.target.value)} placeholder="Invite by email" />
                    <button className="blackpill" type="button" onClick={addPerson}>
                      Invite
                    </button>
                  </div>
                )}
                {sheet && (
                  <div className="sheet-bg" onClick={() => setSheet(null)}>
                    <div className="sheet" onClick={(e) => e.stopPropagation()}>
                      <button className="row" type="button" onClick={() => replyTo(sheet)}>
                        Reply
                      </button>
                      <button
                        className="row"
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(sheet.text);
                          setSheet(null);
                        }}
                      >
                        Copy
                      </button>
                      {sheet.role === "aeko" && (
                        <button className="row" type="button" onClick={() => regenerateFrom(sheet)}>
                          Regenerate
                        </button>
                      )}
                      <button className="row danger" type="button" onClick={() => setSheet(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </div>
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
    <div className="aeko-root onboard">
      <div className="meet" style={{ maxWidth: 520, margin: "0 auto", paddingTop: 24, width: "100%" }}>
        <button className="back" type="button" onClick={onBack}>
          ← Back
        </button>
        <h1>Brain settings</h1>
        <p className="sub">{userEmail ? `Signed in as ${userEmail}` : "Keys stay in this browser only."}</p>
        <div className="cards">
          <button className={cfg.mode === "byok" ? "cardbtn on" : "cardbtn"} type="button" onClick={() => setCfg({ ...cfg, mode: "byok", baseUrl: "https://api.openai.com/v1" })}>
            API key + URL<span>OpenAI, Groq, OpenRouter, LM Studio</span>
          </button>
          <button className={cfg.mode === "server" ? "cardbtn on" : "cardbtn"} type="button" onClick={() => setCfg({ ...cfg, mode: "server", baseUrl: "http://127.0.0.1:11434/v1" })}>
            Own server<span>Any OpenAI-compatible /v1</span>
          </button>
          <button className={cfg.mode === "gguf" ? "cardbtn on" : "cardbtn"} type="button" onClick={() => setCfg({ ...cfg, mode: "gguf" })}>
            GGUF on device<span>Android Models screen</span>
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
                  setStatus(ok ? "Connected — tools enabled." : "Reached endpoint but test failed.");
                } catch (e) {
                  setStatus(String(e));
                }
              }}
            >
              Test connection
            </button>
          </>
        )}
        <p className="tiny">{status}</p>
        <button className="blackpill" type="button" onClick={() => onDone(cfg)} style={{ width: "100%", marginTop: 12 }}>
          Save & open inbox
        </button>
        {userEmail && (
          <a className="ghostlink" href="/api/auth/signout" style={{ display: "block", textAlign: "center", marginTop: 12 }}>
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
