"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  decryptMessage,
  encryptMessage,
  loadBrain,
  newRoomKey,
  publicJwk,
  saveBrain,
  unwrapRoomKey,
  wrapRoomKey,
} from "@/lib/crypto";
import { streamChat } from "@/lib/llm";
import { httpFetch, webSearch } from "@/lib/web-tools";
import {
  appendLocalMessage,
  createLocalRoom,
  getLocalRoom,
  listLocalRooms,
  replaceLocalMessages,
} from "@/lib/local-rooms";
import type { BrainConfig, Line, Room, RoomPreview, View } from "@/components/aeko-app-types";
import {
  AgentDot,
  IconAttach,
  IconBack,
  IconFile,
  IconMic,
  IconPlus,
  IconSend,
  IconSettings,
  MessageRow,
  taskColor,
} from "@/components/ui-primitives";

const CHIPS = ["Summarize this", "Search the web", "Make a checklist", "Write code"];

function formatTime(ts: number) {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
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

function emptyBrain(): BrainConfig {
  return { mode: "byok", baseUrl: "", apiKey: "", model: "gpt-4o-mini", proxyViaVercel: false, valid: false, onboarded: true };
}

export function AekoApp({ userEmail }: { userEmail: string | null }) {
  const wide = useMediaQuery("(min-width: 841px)");
  const [brain, setBrain] = useState<BrainConfig | null>(null);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<View>("inbox");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [previews, setPreviews] = useState<Record<string, RoomPreview>>({});
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomKey, setRoomKey] = useState<string | null>(null);
  const [localMode, setLocalMode] = useState(false);
  const [members, setMembers] = useState<string[]>([]);
  const [messages, setMessages] = useState<Line[]>([]);
  const [draft, setDraft] = useState("");
  const [invite, setInvite] = useState("");
  const [title, setTitle] = useState("General");
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

  useEffect(() => {
    loadBrain().then((b) => {
      const cfg = b ?? emptyBrain();
      if (!cfg.onboarded) void saveBrain({ ...cfg, onboarded: true });
      setBrain({ ...cfg, onboarded: true });
      setReady(true);
    });
    fetch("/api/health")
      .then((r) => r.json() as Promise<{ durable?: boolean; db?: string }>)
      .then((j) => setDurable(Boolean(j.durable) || j.db === "postgres"))
      .catch(() => setDurable(null));
  }, []);

  const refreshRooms = useCallback(async () => {
    if (!userEmail) {
      const local = listLocalRooms().map((r) => ({
        id: r.id,
        title: r.title,
        lastAt: r.lastAt,
        messageCount: r.messages.length,
        local: true,
      }));
      setRooms(local);
      setPreviews(
        Object.fromEntries(
          local.map((r) => {
            const full = getLocalRoom(r.id);
            const last = full?.messages[full.messages.length - 1];
            return [r.id, { text: last?.text.slice(0, 100) ?? "", lastAt: r.lastAt ?? 0 }];
          }),
        ),
      );
      return;
    }
    const res = await fetch("/api/rooms");
    if (!res.ok) return;
    const json = (await res.json()) as { rooms: Room[] };
    setRooms(json.rooms.map((r) => ({ ...r, local: false })));
  }, [userEmail]);

  useEffect(() => {
    if (!ready) return;
    refreshRooms();
    const t = window.setInterval(refreshRooms, 15000);
    return () => window.clearInterval(t);
  }, [ready, refreshRooms]);

  useEffect(() => {
    if (!roomId) return;
    if (roomId.startsWith("local-") || localMode) {
      const room = getLocalRoom(roomId);
      setLocalMode(true);
      setRoomKey("local");
      setMessages(room?.messages ?? []);
      setMembers([]);
      return;
    }
    if (!userEmail) return;
    openRemoteRoom(roomId);
    const t = window.setInterval(() => openRemoteRoom(roomId), 15000);
    return () => window.clearInterval(t);
  }, [roomId, userEmail, localMode]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function openRemoteRoom(id: string) {
    const res = await fetch(`/api/rooms/${id}/messages`);
    if (!res.ok) return;
    const json = await res.json();
    const mine = json.membership as { wrappedKey: string; wrapIv: string; peerPub: string };
    try {
      const key = await unwrapRoomKey(mine.wrappedKey, mine.wrapIv, JSON.parse(mine.peerPub));
      setRoomKey(key);
      setLocalMode(false);
      setMembers((json.members as { email: string }[]).map((m) => m.email));
      const lines: Line[] = [];
      for (const m of json.messages as { id: string; from: string; iv: string; ciphertext: string; createdAt?: number }[]) {
        const text = await decryptMessage(key, m.iv, m.ciphertext).catch(() => "(undecryptable)");
        lines.push({ id: m.id, role: m.from === userEmail ? "user" : "aeko", text, at: m.createdAt });
      }
      setMessages(lines);
      const last = lines[lines.length - 1];
      if (last) setPreviews((p) => ({ ...p, [id]: { text: last.text.slice(0, 100), lastAt: last.at ?? Date.now() } }));
    } catch {
      setMessages([]);
    }
  }

  function createTask() {
    const name = title.trim() || `Task ${rooms.length + 1}`;
    if (!userEmail) {
      const room = createLocalRoom(name);
      setLocalMode(true);
      setRoomId(room.id);
      setRoomKey("local");
      setMessages([]);
      setTitle(name);
      refreshRooms();
      return;
    }
    void createRemoteTask(name);
  }

  async function createRemoteTask(name: string): Promise<{ id: string; key: string } | null> {
    const pub = publicJwk();
    if (!pub) {
      setStatus("Could not create crypto identity in this browser");
      return null;
    }
    const key = newRoomKey();
    const wrap = await wrapRoomKey(key, pub);
    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: name, wrappedKey: wrap.wrappedKey, wrapIv: wrap.wrapIv, peerPub: JSON.stringify(pub) }),
    });
    if (!res.ok) {
      setStatus(`Could not create task (${res.status})`);
      return null;
    }
    const { id } = (await res.json()) as { id: string };
    setRoomId(id);
    setRoomKey(key);
    setLocalMode(false);
    setMessages([]);
    setTitle(name);
    refreshRooms();
    return { id, key };
  }

  async function addPerson() {
    if (!roomId || !roomKey || localMode || !invite.trim()) return;
    const email = invite.trim().toLowerCase();
    const lookup = await fetch(`/api/users?email=${encodeURIComponent(email)}`);
    if (!lookup.ok) {
      setStatus("They must sign in once first");
      return;
    }
    const user = (await lookup.json()) as { publicKey: string };
    const wrap = await wrapRoomKey(roomKey, JSON.parse(user.publicKey));
    await fetch(`/api/rooms/${roomId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, wrappedKey: wrap.wrappedKey, wrapIv: wrap.wrapIv, peerPub: JSON.stringify(publicJwk()) }),
    });
    await fetch(`/api/rooms/${roomId}/notify`, { method: "POST" });
    setInvite("");
    setMembers((m) => [...new Set([...m, email])]);
  }

  async function postPlain(text: string, rid = roomId, key = roomKey) {
    if (!rid || !key || !text.trim()) return;
    if (localMode || rid.startsWith("local-")) return;
    const enc = await encryptMessage(key, text);
    await fetch(`/api/rooms/${rid}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(enc) });
    await fetch(`/api/rooms/${rid}/notify`, { method: "POST" });
    setPreviews((p) => ({ ...p, [rid]: { text: text.slice(0, 100), lastAt: Date.now() } }));
  }

  function persistLocal(next: Line[]) {
    if (!roomId) return;
    replaceLocalMessages(roomId, next);
    const last = next[next.length - 1];
    if (last) setPreviews((p) => ({ ...p, [roomId]: { text: last.text.slice(0, 100), lastAt: last.at ?? Date.now() } }));
    refreshRooms();
  }

  async function run(prompt: string) {
    if (!prompt || busy || !brain) return;
    let activeRoomId = roomId;
    let activeKey = roomKey;
    let isLocal = localMode;

    if (!activeRoomId) {
      if (!userEmail) {
        const room = createLocalRoom(title.trim() || "General");
        activeRoomId = room.id;
        activeKey = "local";
        isLocal = true;
        setLocalMode(true);
        setRoomId(room.id);
        setRoomKey("local");
      } else {
        const created = await createRemoteTask(title.trim() || "General");
        if (!created) return;
        activeRoomId = created.id;
        activeKey = created.key;
        isLocal = false;
      }
    }
    if (!activeRoomId) return;

    const text = codeMode && !prompt.toLowerCase().includes("code") ? `Code Mode. ${prompt}` : prompt;
    setDraft("");
    const userLine: Line = { id: String(Date.now()), role: "user", text, at: Date.now() };
    const nextMsgs = [...messages, userLine];
    setMessages(nextMsgs);
    if (isLocal) {
      appendLocalMessage(activeRoomId, userLine);
      persistLocal(nextMsgs);
    } else if (activeKey) await postPlain(text, activeRoomId, activeKey);

    setBusy(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const traces: string[] = [];
    const aekoId = String(Date.now() + 1);

    try {
      if (userEmail && (text.toLowerCase().includes("search") || text.toLowerCase().includes("look up"))) {
        const note = await webSearch(text).catch((e) => `web_search:\n${String(e)}`);
        traces.push(note);
        const toolLine = { id: `${Date.now()}-t`, role: "tool" as const, text: note };
        setMessages((m) => [...m, toolLine]);
      }
      const url = text.match(/https:\/\/[^\s]+/)?.[0];
      if (userEmail && url) {
        const note = await httpFetch(url).catch((e) => `http_fetch:\n${String(e)}`);
        traces.push(note);
        setMessages((m) => [...m, { id: `${Date.now()}-f`, role: "tool", text: note }]);
      }

      setMessages((m) => [...m, { id: aekoId, role: "aeko", text: "" }]);
      let full = "";
      const system = `You are Aeko, a sharp personal assistant. Be concise and useful.${agentMode ? " Agent mode." : ""}${vault ? " Use vault context." : ""}`;
      const user = [text, vault ? `Vault:\n${vault.slice(0, 4000)}` : "", traces.length ? traces.join("\n\n") : ""].filter(Boolean).join("\n\n");

      if (brain.valid && brain.baseUrl) {
        full = await streamChat({
          baseUrl: brain.baseUrl,
          apiKey: brain.apiKey,
          model: brain.model,
          messages: [{ role: "system", content: system }, { role: "user", content: user }],
          signal: ctrl.signal,
          onDelta: (chunk) => setMessages((m) => m.map((line) => (line.id === aekoId ? { ...line, text: line.text + chunk } : line))),
        });
      } else {
        full =
          "Add an API key in Settings (gear icon) to get real replies. " +
          (userEmail ? "Tools need sign-in." : "Local mode works without sign-in — add a key in Settings.");
        setMessages((m) => m.map((line) => (line.id === aekoId ? { ...line, text: full } : line)));
      }

      const aekoLine: Line = { id: aekoId, role: "aeko", text: full, at: Date.now() };
      setMessages((m) => {
        const merged = m.map((line) => (line.id === aekoId ? aekoLine : line));
        if (isLocal && activeRoomId) persistLocal(merged);
        return merged;
      });

      if (!isLocal && activeKey) await postPlain(full, activeRoomId, activeKey);
      refreshRooms();
    } catch (e) {
      const err = String(e);
      setMessages((m) => [...m, { id: String(Date.now() + 2), role: "aeko", text: err }]);
    }
    abortRef.current = null;
    setBusy(false);
  }

  function replyTo(line: Line) {
    setDraft((d) => `> ${line.text.slice(0, 200)}\n`);
    setSheet(null);
  }

  function regenerateFrom(line: Line) {
    const idx = messages.findIndex((m) => m.id === line.id);
    for (let i = idx - 1; i >= 0; i--) {
      if (messages[i]!.role === "user") {
        setSheet(null);
        run(messages[i]!.text);
        return;
      }
    }
  }

  if (!ready || !brain) return null;

  if (view === "brain") {
    return <BrainForm userEmail={userEmail} initial={brain} onBack={() => setView("inbox")} onDone={async (cfg) => { await saveBrain(cfg); setBrain(cfg); setView("inbox"); }} />;
  }

  const current = rooms.find((r) => r.id === roomId)?.title ?? title;
  const showInbox = wide || !roomId;
  const showThread = wide || Boolean(roomId);
  const filtered = rooms.filter((r) => !filter || r.title.toLowerCase().includes(filter.toLowerCase()));
  const needsKey = !brain.valid && brain.mode !== "gguf";

  return (
    <div className="aeko-root">
      <div className={`aeko-shell ${!wide ? "single" : ""}`}>
        <aside className={`inbox ${!showInbox ? "hidden-mobile" : ""}`}>
          <div className="inbox-head">
            <div className="brand-mark">A</div>
            <h2>Aeko</h2>
            <button className="iconbtn" type="button" aria-label="Settings" onClick={() => setView("brain")}><IconSettings /></button>
            <button className="iconbtn" type="button" aria-label="New task" onClick={createTask}><IconPlus /></button>
          </div>

          {needsKey && (
            <div className="inbox-banner">
              Add your API key in <button type="button" className="ghostlink" style={{ color: "#fff", padding: 0 }} onClick={() => setView("brain")}>Settings</button> to chat with a real model.
            </div>
          )}
          {!userEmail && (
            <div className="inbox-banner" style={{ background: "rgba(56,189,248,0.12)", borderColor: "rgba(56,189,248,0.25)", color: "#7dd3fc" }}>
              Local demo mode — tasks save in this browser. <a href="/login">Sign in</a> to sync.
            </div>
          )}
          {userEmail && durable === false && (
            <div className="inbox-banner">Cloud rooms won&apos;t persist until Neon DATABASE_URL is set on Vercel.</div>
          )}
          {status && <p className="inbox-banner">{status}</p>}

          <div className="inbox-actions">
            <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New task name" />
            {rooms.length > 3 && (
              <input className="field" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search…" />
            )}
          </div>

          <div className="inbox-list">
            {filtered.length === 0 ? (
              <div className="inbox-empty">
                {rooms.length === 0 ? "No tasks yet. Name one above and tap +." : "No matches."}
              </div>
            ) : (
              filtered.map((r) => {
                const preview = previews[r.id]?.text || "New conversation";
                const lastAt = previews[r.id]?.lastAt ?? r.lastAt ?? 0;
                return (
                  <button key={r.id} type="button" className={r.id === roomId ? "taskrow on" : "taskrow"} onClick={() => setRoomId(r.id)}>
                    <div className="task-dot" style={{ background: taskColor(r.id) }}>{r.title[0]?.toUpperCase()}</div>
                    <div>
                      <div className="title">{r.title}</div>
                      <div className="preview">{preview}</div>
                    </div>
                    <div className="time">{formatTime(lastAt)}</div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {showThread && (
          <section className={`thread ${!roomId && !wide ? "hidden-mobile" : ""}`}>
            {!roomId ? (
              <div className="empty-chat">
                <h3>Pick a task</h3>
                <p>Select a conversation from the sidebar or create a new one to start.</p>
              </div>
            ) : (
              <>
                <div className="thread-head">
                  {!wide && (
                    <button className="iconbtn" type="button" style={{ background: "var(--canvas-muted)", color: "var(--ink)", border: "1px solid var(--line)" }} onClick={() => setRoomId(null)}>
                      <IconBack />
                    </button>
                  )}
                  <AgentDot busy={busy} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong>{current}</strong>
                    <div className="thread-meta">{busy ? "Generating…" : brain.valid ? "Connected" : "Add API key in Settings"}</div>
                  </div>
                  <div className="thread-head-actions">
                    <button type="button" className={codeMode ? "head-chip on" : "head-chip"} onClick={() => setCodeMode((v) => !v)}>Code</button>
                    <button type="button" className={agentMode ? "head-chip on" : "head-chip"} onClick={() => setAgentMode((v) => !v)}>Agent</button>
                    {busy && <button type="button" className="stopbtn" onClick={() => abortRef.current?.abort()}>Stop</button>}
                  </div>
                </div>

                <div className="thread-body" ref={bodyRef}>
                  {messages.length === 0 && (
                    <div className="empty-chat">
                      <h3>Start chatting</h3>
                      <p>Ask anything — summaries, code, web search, or file analysis.</p>
                    </div>
                  )}
                  {messages.map((m) => (
                    <MessageRow key={m.id} line={m} busy={busy} onContextMenu={(e) => { e.preventDefault(); setSheet(m); }} />
                  ))}
                </div>

                <div className="composer-dock">
                  <div className="chips">
                    {CHIPS.map((c) => (
                      <button key={c} type="button" className="chip" onClick={() => run(c)}>{c}</button>
                    ))}
                  </div>
                  <form className="composer" onSubmit={(e: FormEvent) => { e.preventDefault(); run(draft.trim()); }}>
                    <div className="composer-tools">
                      <button type="button" aria-label="Attach" onClick={() => setShowAttach((v) => !v)}><IconAttach /></button>
                      {showAttach && (
                        <button type="button" aria-label="File" onClick={() => document.getElementById("vault-file")?.click()}><IconFile /></button>
                      )}
                    </div>
                    <input id="vault-file" type="file" hidden onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setVaultName(file.name);
                      setVault(await file.text());
                      setShowAttach(false);
                    }} />
                    <div className="composer-input">
                      <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Message…" rows={1}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); run(draft.trim()); } }} />
                    </div>
                    <button className="sendbtn" type="submit" disabled={!draft.trim() || busy} aria-label="Send"><IconSend /></button>
                  </form>
                </div>

                {userEmail && !localMode && (
                  <div className="invitebar">
                    <input className="field" value={invite} onChange={(e) => setInvite(e.target.value)} placeholder="Invite email" />
                    <button type="button" className="blackpill" onClick={addPerson}>Invite</button>
                  </div>
                )}

                {sheet && (
                  <div className="sheet-bg" onClick={() => setSheet(null)}>
                    <div className="sheet" onClick={(e) => e.stopPropagation()}>
                      <button className="row" type="button" onClick={() => replyTo(sheet)}>Reply</button>
                      <button className="row" type="button" onClick={() => { navigator.clipboard.writeText(sheet.text); setSheet(null); }}>Copy</button>
                      {sheet.role === "aeko" && <button className="row" type="button" onClick={() => regenerateFrom(sheet)}>Regenerate</button>}
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

function BrainForm({ userEmail, initial, onBack, onDone }: { userEmail: string | null; initial: BrainConfig; onBack: () => void; onDone: (cfg: BrainConfig) => void }) {
  const [cfg, setCfg] = useState<BrainConfig>(initial);
  const [status, setStatus] = useState("");

  return (
    <div className="aeko-root onboard">
      <div className="meet">
        <button className="back" type="button" onClick={onBack}>← Back to inbox</button>
        <h1>Settings</h1>
        <p className="sub">{userEmail ? `Signed in as ${userEmail}` : "Keys stay in this browser only."}</p>
        <div className="cards">
          <button className={cfg.mode === "byok" ? "cardbtn on" : "cardbtn"} type="button" onClick={() => setCfg({ ...cfg, mode: "byok", baseUrl: "https://api.openai.com/v1" })}>
            API key<span>OpenAI, Groq, OpenRouter</span>
          </button>
          <button className={cfg.mode === "server" ? "cardbtn on" : "cardbtn"} type="button" onClick={() => setCfg({ ...cfg, mode: "server", baseUrl: "http://127.0.0.1:11434/v1" })}>
            Local server<span>Ollama, LM Studio, llama-server</span>
          </button>
        </div>
        {cfg.mode !== "gguf" && (
          <>
            <input className="field" style={{ background: "#fff", color: "var(--ink)", borderColor: "var(--line)" }} value={cfg.baseUrl} onChange={(e) => setCfg({ ...cfg, baseUrl: e.target.value })} placeholder="Base URL" />
            <input className="field" style={{ background: "#fff", color: "var(--ink)", borderColor: "var(--line)" }} type="password" value={cfg.apiKey} onChange={(e) => setCfg({ ...cfg, apiKey: e.target.value })} placeholder="API key" />
            <input className="field" style={{ background: "#fff", color: "var(--ink)", borderColor: "var(--line)" }} value={cfg.model} onChange={(e) => setCfg({ ...cfg, model: e.target.value })} placeholder="Model" />
            <button className="cardbtn" type="button" onClick={async () => {
              setStatus("Testing…");
              const { testBrain } = await import("@/lib/llm");
              try {
                const ok = await testBrain(cfg.baseUrl, cfg.apiKey, cfg.model);
                setCfg((c) => ({ ...c, valid: ok }));
                setStatus(ok ? "Connected." : "Could not reach model.");
              } catch (e) { setStatus(String(e)); }
            }}>Test connection</button>
          </>
        )}
        <p className="tiny">{status}</p>
        <button className="blackpill full" type="button" onClick={() => onDone({ ...cfg, onboarded: true })}>Save</button>
        {userEmail ? <a className="ghostlink" href="/api/auth/signout" style={{ display: "block", textAlign: "center" }}>Sign out</a> : <a className="ghostlink" href="/login" style={{ display: "block", textAlign: "center" }}>Sign in to sync</a>}
      </div>
    </div>
  );
}
