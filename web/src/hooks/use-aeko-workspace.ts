"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  decryptMessage,
  encryptMessage,
  loadBrain,
  newRoomKey,
  saveBrain,
  unwrapRoomKey,
  wrapRoomKey,
} from "@/lib/crypto";
import { buildChatHistory, decryptLine } from "@/lib/chat-history";
import { buildAgentSystem, executeAgentTools, runAgentLoop, shouldInvokeAgent } from "@/lib/agent-engine";
import { encodeAssistantPayload, AGENT_ROSTER, getAgent, getRoomAgentId, setRoomAgentId, parseAgentMention } from "@/lib/agents";
import { ensureIdentity, syncIdentityToServer } from "@/lib/identity";
import { shouldUseProxy } from "@/lib/llm";
import { registerWebPush } from "@/lib/push-client";
import { clearVault, loadVault, saveVault } from "@/lib/vault-store";
import { appendLocalMessage, deleteLocalRoom, renameLocalRoom, replaceLocalMessages } from "@/lib/local-rooms";
import type { BrainConfig, Line, Room, RoomPreview, View } from "@/components/aeko-app-types";

export function formatTime(ts: number) {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function emptyBrain(): BrainConfig {
  return { mode: "byok", baseUrl: "", apiKey: "", model: "gpt-4o-mini", proxyViaVercel: false, valid: false, onboarded: true };
}

export function useAekoWorkspace(userEmail: string, initialRoomId?: string, initialView: View = "desk") {
  const router = useRouter();
  const pathname = usePathname();
  const [brain, setBrain] = useState<BrainConfig | null>(null);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<View>(initialView);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [previews, setPreviews] = useState<Record<string, RoomPreview>>({});
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomKey, setRoomKey] = useState<string | null>(null);
  const [localMode, setLocalMode] = useState(false);
  const [members, setMembers] = useState<string[]>([]);
  const [messages, setMessages] = useState<Line[]>([]);
  const [draft, setDraft] = useState("");
  const [deskDraft, setDeskDraft] = useState("");
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
  const [webMode, setWebMode] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteRole, setInviteRole] = useState<"member" | "owner">("member");
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string; text: string; at: number }[]>([]);
  const [typers, setTypers] = useState<string[]>([]);
  const [deskSearch, setDeskSearch] = useState("");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [activeAgentId, setActiveAgentId] = useState("aeko");
  const [enginePhase, setEnginePhase] = useState<"idle" | "thinking" | "speaking">("idle");
  const abortRef = useRef<AbortController | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const deskSearchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialRoomId) {
      setRoomId(initialRoomId);
      setActiveAgentId(getRoomAgentId(initialRoomId));
      return;
    }
    const pinned = localStorage.getItem("aeko-pinned-agent");
    if (pinned) setActiveAgentId(pinned);
  }, [initialRoomId]);

  useEffect(() => {
    if (pathname?.startsWith("/t/")) setView("chat");
    else if (pathname === "/settings") setView("brain");
    else if (pathname === "/") setView("desk");
  }, [pathname]);

  useEffect(() => {
    loadBrain().then((b) => {
      const raw = b ?? emptyBrain();
      const cfg: BrainConfig = { ...raw, mode: raw.mode === "server" ? "server" : "byok", onboarded: true };
      if (!raw.onboarded) void saveBrain(cfg);
      setBrain(cfg);
      setReady(true);
      if (!cfg.valid && initialView !== "brain") {
        setView("brain");
        router.push("/settings");
      }
    });
    fetch("/api/health")
      .then((r) => r.json() as Promise<{ durable?: boolean; db?: string }>)
      .then((j) => setDurable(Boolean(j.durable) || j.db === "postgres"))
      .catch(() => setDurable(null));
  }, [initialView, router]);

  useEffect(() => {
    if (!userEmail || !ready) return;
    void syncIdentityToServer();
    void registerWebPush();
  }, [userEmail, ready]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!roomId) {
      setVault("");
      setVaultName("");
      return;
    }
    void loadVault(roomId, roomKey).then((stored) => {
      if (stored) {
        setVault(stored.text);
        setVaultName(stored.name);
      } else {
        setVault("");
        setVaultName("");
      }
    });
  }, [roomId, roomKey]);

  useEffect(() => {
    if (roomId) setActiveAgentId(getRoomAgentId(roomId));
  }, [roomId]);

  const activeAgent = getAgent(activeAgentId);

  const refreshRooms = useCallback(async () => {
    const res = await fetch("/api/rooms");
    if (!res.ok) return;
    const json = (await res.json()) as { rooms: Room[] };
    setRooms(json.rooms.map((r) => ({ ...r, local: false })));
  }, []);

  useEffect(() => {
    if (!ready) return;
    refreshRooms();
  }, [ready, refreshRooms]);

  const openRemoteRoom = useCallback(async (id: string) => {
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
        const raw = await decryptMessage(key, m.iv, m.ciphertext).catch(() => "(undecryptable)");
        lines.push(decryptLine(m.id, m.from, userEmail, raw, m.createdAt));
      }
      setMessages(lines);
      const last = lines[lines.length - 1];
      if (last) setPreviews((p) => ({ ...p, [id]: { text: last.text.slice(0, 100), lastAt: last.at ?? Date.now() } }));
    } catch {
      setMessages([]);
    }
  }, [userEmail]);

  useEffect(() => {
    if (!roomId || localMode || roomId.startsWith("local-")) return;
    openRemoteRoom(roomId);
    const es = new EventSource(`/api/rooms/${roomId}/stream`);
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data) as { type?: string; email?: string; active?: boolean };
        if (data.type === "message.new") void openRemoteRoom(roomId);
        if (data.type === "room.renamed") refreshRooms();
        if (data.type === "typing" && data.email) {
          setTypers((t) => (data.active ? [...new Set([...t, data.email!])] : t.filter((x) => x !== data.email)));
        }
        if (data.type === "member.joined") {
          setNotifications((n) => [{ id: String(Date.now()), text: `${data.email} joined`, at: Date.now() }, ...n].slice(0, 20));
        }
      } catch {
        /* ignore */
      }
    };
    return () => es.close();
  }, [roomId, localMode, refreshRooms, openRemoteRoom]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function openChat(id: string) {
    setRoomId(id);
    setActiveAgentId(getRoomAgentId(id));
    setView("chat");
    router.push(`/t/${id}`);
  }

  function backToDesk() {
    setView("desk");
    setSheet(null);
    router.push("/");
  }

  function goSettings() {
    setView("brain");
    router.push("/settings");
  }

  async function createRemoteTask(name: string): Promise<{ id: string; key: string } | null> {
    let pub: JsonWebKey;
    try {
      pub = await ensureIdentity();
    } catch {
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
    setRoomAgentId(id, activeAgentId);
    setLocalMode(false);
    setMessages([]);
    setTitle(name);
    refreshRooms();
    return { id, key };
  }

  function createTask() {
    const name = title.trim() || `Task ${rooms.length + 1}`;
    void createRemoteTask(name).then((created) => {
      if (created) openChat(created.id);
    });
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
      body: JSON.stringify({ email, wrappedKey: wrap.wrappedKey, wrapIv: wrap.wrapIv, peerPub: JSON.stringify(await ensureIdentity()) }),
    });
    await fetch(`/api/rooms/${roomId}/notify`, { method: "POST" });
    setInvite("");
    setShowInvite(false);
    setMembers((m) => [...new Set([...m, email])]);
    setNotifications((n) => [{ id: String(Date.now()), text: `Invited ${email}`, at: Date.now() }, ...n].slice(0, 20));
  }

  async function postPlain(text: string, rid = roomId, key = roomKey, assistantAgentId?: string) {
    if (!rid || !key || !text.trim()) return;
    if (localMode || rid.startsWith("local-")) return;
    const payload = assistantAgentId ? encodeAssistantPayload(text, assistantAgentId) : text;
    const enc = await encryptMessage(key, payload);
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

  async function sendHumanMessage(prompt: string, fromDesk = false) {
    if (!prompt || busy) return;
    let activeRoomId = roomId;
    let activeKey = roomKey;
    let isLocal = localMode;

    if (!activeRoomId) {
      const created = await createRemoteTask(title.trim() || prompt.slice(0, 40) || "General");
      if (!created) return;
      activeRoomId = created.id;
      activeKey = created.key;
      isLocal = false;
    }

    if (fromDesk || view === "desk") setView("chat");
    if (fromDesk) setDeskDraft("");
    else setDraft("");

    const userLine: Line = { id: String(Date.now()), role: "user", text: prompt, at: Date.now() };
    const nextMsgs = [...messages, userLine];
    setMessages(nextMsgs);
    if (isLocal) {
      appendLocalMessage(activeRoomId, userLine);
      persistLocal(nextMsgs);
    } else if (activeKey) await postPlain(prompt, activeRoomId, activeKey);
    refreshRooms();
  }

  async function invokeAgent(prompt: string, fromDesk = false) {
    if (!prompt || busy || !brain) return;
    let activeRoomId = roomId;
    let activeKey = roomKey;
    let isLocal = localMode;

    if (!activeRoomId) {
      const created = await createRemoteTask(title.trim() || prompt.slice(0, 40) || "General");
      if (!created) return;
      activeRoomId = created.id;
      activeKey = created.key;
      isLocal = false;
    }

    if (fromDesk || view === "desk") {
      setView("chat");
      router.push(`/t/${activeRoomId}`);
    }

    const mention = parseAgentMention(prompt);
    if (mention) setActiveAgentId(mention);

    const text = codeMode && !prompt.toLowerCase().includes("code") ? `Code Mode. ${prompt}` : prompt;
    if (fromDesk) setDeskDraft("");
    else setDraft("");
    const userLine: Line = { id: String(Date.now()), role: "user", text, at: Date.now() };
    const nextMsgs = [...messages, userLine];
    setMessages(nextMsgs);
    if (isLocal) {
      appendLocalMessage(activeRoomId, userLine);
      persistLocal(nextMsgs);
    } else if (activeKey) await postPlain(text, activeRoomId, activeKey);

    setBusy(true);
    setEnginePhase("thinking");
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const agent = getAgent(getRoomAgentId(activeRoomId));
    const replyId = String(Date.now() + 1);

    try {
      const traces = await executeAgentTools(text, {
        tools: agent.tools,
        webMode,
        agentMode,
        vault,
        vaultName,
        onTool: (toolLine) => setMessages((m) => [...m, toolLine]),
      });

      setMessages((m) => [...m, { id: replyId, role: "aeko", text: "", agentId: agent.id, at: Date.now() }]);
      setEnginePhase("speaking");
      const system = buildAgentSystem(agent, { codeMode, vault: Boolean(vault), agentMode });
      const extraContext = [vault ? `Vault:\n${vault.slice(0, 4000)}` : "", traces.length ? traces.join("\n\n") : ""]
        .filter(Boolean)
        .join("\n\n");
      const useProxy = shouldUseProxy(brain.baseUrl, brain.mode, brain.proxyViaVercel);

      if (!brain.valid || !brain.baseUrl) {
        throw new Error("Connect a model in Settings to run agents.");
      }

      const { text: full, meta } = await runAgentLoop({
        brain,
        agent,
        history: buildChatHistory(nextMsgs, system, extraContext),
        useProxy,
        signal: ctrl.signal,
        onDelta: (chunk) => {
          setMessages((m) => m.map((line) => (line.id === replyId ? { ...line, text: line.text + chunk } : line)));
        },
        onTool: (toolLine) => setMessages((m) => [...m, toolLine]),
      });

      const replyLine: Line = { id: replyId, role: "aeko", text: full, at: Date.now(), agentId: agent.id, meta };
      setMessages((m) => {
        const merged = m.map((line) => (line.id === replyId ? replyLine : line));
        if (isLocal && activeRoomId) persistLocal(merged);
        return merged;
      });

      if (!isLocal && activeKey) await postPlain(full, activeRoomId, activeKey, agent.id);
      refreshRooms();
    } catch (e) {
      const err = String(e);
      setMessages((m) => [...m, { id: String(Date.now() + 2), role: "aeko", text: err, agentId: agent.id }]);
    }
    abortRef.current = null;
    setEnginePhase("idle");
    setBusy(false);
  }

  async function run(prompt: string, fromDesk = false) {
    if (shouldInvokeAgent(prompt, agentMode)) return invokeAgent(prompt, fromDesk);
    return sendHumanMessage(prompt, fromDesk);
  }

  function pingTyping(active: boolean) {
    if (!roomId || localMode) return;
    void fetch(`/api/rooms/${roomId}/typing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
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

  async function renameTask(id: string, nextTitle: string) {
    const titleNext = nextTitle.trim();
    if (!titleNext) return;
    if (id.startsWith("local-")) {
      renameLocalRoom(id, titleNext);
      refreshRooms();
      return;
    }
    const res = await fetch(`/api/rooms/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: titleNext }),
    });
    if (res.ok) refreshRooms();
    else setStatus("Could not rename task");
  }

  async function deleteTask(id: string) {
    if (!window.confirm("Delete this task and all messages?")) return;
    if (id.startsWith("local-")) {
      deleteLocalRoom(id);
      clearVault(id);
    } else {
      const res = await fetch(`/api/rooms/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setStatus("Could not delete task");
        return;
      }
    }
    if (roomId === id) {
      setRoomId(null);
      setMessages([]);
      setView("desk");
    }
    refreshRooms();
  }

  const paletteActions = [
    { id: "new", label: "New task", hint: "Create a focused room", run: createTask },
    { id: "settings", label: "Open settings", hint: "Model and account", run: goSettings },
    { id: "search", label: "Focus task search", hint: "Sidebar filter", run: () => deskSearchRef.current?.focus() },
    ...rooms.slice(0, 8).map((r) => ({
      id: r.id,
      label: `Open ${r.title}`,
      hint: r.local ? "Local task" : "Cloud task",
      run: () => openChat(r.id),
    })),
    ...AGENT_ROSTER.map((a) => ({
      id: `agent-${a.id}`,
      label: `Switch to ${a.name}`,
      hint: a.tagline,
      run: () => {
        setActiveAgentId(a.id);
        if (roomId) setRoomAgentId(roomId, a.id);
      },
    })),
  ];

  const current = rooms.find((r) => r.id === roomId)?.title ?? title;
  const needsKey = !brain?.valid;
  const featured = rooms[0];
  const filteredRooms = deskSearch.trim()
    ? rooms.filter((r) => r.title.toLowerCase().includes(deskSearch.trim().toLowerCase()))
    : rooms;
  const featuredPreview = featured ? previews[featured.id]?.text || "Tap to continue this conversation" : "Create your first task and start chatting with Aeko.";

  async function attachVaultFile(file: File, closeAttach = false) {
    setVaultName(file.name);
    const text = await file.text();
    setVault(text);
    if (roomId) void saveVault(roomId, file.name, text, roomKey);
    if (closeAttach) setShowAttach(false);
  }

  return {
    router,
    brain,
    setBrain,
    ready,
    view,
    setView,
    rooms,
    previews,
    roomId,
    roomKey,
    localMode,
    members,
    messages,
    draft,
    setDraft,
    deskDraft,
    setDeskDraft,
    invite,
    setInvite,
    status,
    durable,
    sheet,
    setSheet,
    busy,
    codeMode,
    setCodeMode,
    agentMode,
    setAgentMode,
    webMode,
    setWebMode,
    showAttach,
    setShowAttach,
    showInvite,
    setShowInvite,
    inviteRole,
    setInviteRole,
    renameOpen,
    setRenameOpen,
    renameValue,
    setRenameValue,
    notifyOpen,
    setNotifyOpen,
    notifications,
    typers,
    deskSearch,
    setDeskSearch,
    paletteOpen,
    setPaletteOpen,
    activeAgentId,
    setActiveAgentId,
    enginePhase,
    abortRef,
    bodyRef,
    deskSearchRef,
    activeAgent,
    current,
    needsKey,
    featured,
    filteredRooms,
    featuredPreview,
    paletteActions,
    openChat,
    backToDesk,
    goSettings,
    createTask,
    addPerson,
    run,
    pingTyping,
    replyTo,
    regenerateFrom,
    renameTask,
    deleteTask,
    attachVaultFile,
  };
}
