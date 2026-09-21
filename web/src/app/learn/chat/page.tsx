"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { LearnShell } from "@/components/learn/shell";
import { CHAT_SEED } from "@/lib/learn-data";
import { completeTask, getChatMessages, loadProfile, loadTutorConfig, saveChatMessages, type LearnChatMessage } from "@/lib/learn-store";

async function readSseStream(res: Response, onDelta: (chunk: string) => void) {
  if (!res.body) throw new Error("empty stream");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n");
    buffer = parts.pop() || "";
    for (const line of parts) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") continue;
      try {
        const json = JSON.parse(data) as { choices?: { delta?: { content?: string } }[] };
        const piece = json.choices?.[0]?.delta?.content || "";
        if (piece) onDelta(piece);
      } catch {
        /* skip */
      }
    }
  }
}

export default function ChatPage() {
  const [messages, setMessages] = useState<LearnChatMessage[]>(CHAT_SEED);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const saved = getChatMessages();
    if (saved.length) setMessages(saved);
  }, []);

  useEffect(() => {
    if (messages.length) saveChatMessages(messages);
  }, [messages]);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim() || busy) return;
    const text = draft.trim();
    setDraft("");
    setError("");
    const userMsg: LearnChatMessage = { id: String(Date.now()), role: "user", text };
    const next = [...messages, userMsg];
    setMessages(next);
    setBusy(true);

    const assistantId = String(Date.now() + 1);
    setMessages((m) => [...m, { id: assistantId, role: "assistant", text: "" }]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const profile = loadProfile();
      const tutor = loadTutorConfig();
      const res = await fetch("/api/learn/tutor", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: profile ?? undefined,
          tutor: tutor.valid ? { baseUrl: tutor.baseUrl, apiKey: tutor.apiKey, model: tutor.model } : undefined,
          messages: next
            .filter((m) => m.text)
            .map((m) => ({ role: m.role, content: m.text })),
        }),
      });

      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
        throw new Error(json.message || json.error || `Request failed (${res.status})`);
      }

      let acc = "";
      await readSseStream(res, (piece) => {
        acc += piece;
        setMessages((m) => m.map((msg) => (msg.id === assistantId ? { ...msg, text: acc } : msg)));
      });
      completeTask("chat", 10);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Chat failed";
      setError(msg);
      setMessages((m) => m.filter((msg) => msg.id !== assistantId));
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  return (
    <LearnShell
      title="GPT chat"
      subtitle="Practice conversation with instant feedback"
      action={
        <Link href="/learn/settings" className="learn-btn secondary sm">
          Settings
        </Link>
      }
    >
      {error && (
        <div className="learn-banner warn" style={{ marginBottom: 16 }}>
          {error}. <Link href="/learn/settings">Add API key</Link>
        </div>
      )}
      <div className="learn-grid-2">
        <div className="learn-card" style={{ minHeight: 480, display: "flex", flexDirection: "column" }}>
          <div className="learn-chat" style={{ flex: 1 }}>
            {messages.map((m) => (
              <div key={m.id} className={`learn-bubble ${m.role === "user" ? "user" : "ai"}`}>
                {m.text || (busy && m.role === "assistant" ? "…" : "")}
              </div>
            ))}
          </div>
          <form onSubmit={send} style={{ display: "flex", gap: 10, marginTop: 16, borderTop: "1px solid var(--learn-line)", paddingTop: 16 }}>
            <input className="learn-input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type your reply…" disabled={busy} />
            <button type="submit" className="learn-btn primary" disabled={busy}>
              {busy ? "…" : "Send"}
            </button>
          </form>
        </div>
        <div className="learn-card soft">
          <h3>Suggested prompts</h3>
          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
            {["Order coffee at a café", "Explain your job", "Debate remote work", "Describe your city"].map((p) => (
              <button key={p} type="button" className="learn-btn secondary full" onClick={() => setDraft(p)} disabled={busy}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </LearnShell>
  );
}
