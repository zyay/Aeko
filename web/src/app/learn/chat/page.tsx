"use client";

import { FormEvent, useState } from "react";
import { LearnShell } from "@/components/learn/shell";
import { CHAT_SEED } from "@/lib/learn-data";

export default function ChatPage() {
  const [messages, setMessages] = useState(CHAT_SEED);
  const [draft, setDraft] = useState("");

  function send(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    const text = draft.trim();
    setMessages((m) => [...m, { id: String(Date.now()), role: "user" as const, text }]);
    setDraft("");
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          id: String(Date.now() + 1),
          role: "assistant" as const,
          text: "Good start. Try answering in two or three full sentences — focus on polite phrasing.",
        },
      ]);
    }, 600);
  }

  return (
    <LearnShell title="GPT chat" subtitle="Practice conversation with instant feedback">
      <div className="learn-grid-2">
        <div className="learn-card" style={{ minHeight: 480, display: "flex", flexDirection: "column" }}>
          <div className="learn-chat" style={{ flex: 1 }}>
            {messages.map((m) => (
              <div key={m.id} className={`learn-bubble ${m.role === "user" ? "user" : "ai"}`}>
                {m.text}
              </div>
            ))}
          </div>
          <form onSubmit={send} style={{ display: "flex", gap: 10, marginTop: 16, borderTop: "1px solid var(--learn-line)", paddingTop: 16 }}>
            <input className="learn-input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type your reply…" />
            <button type="submit" className="learn-btn primary">
              Send
            </button>
          </form>
        </div>
        <div className="learn-card soft">
          <h3>Suggested prompts</h3>
          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
            {["Order coffee at a café", "Explain your job", "Debate remote work", "Describe your city"].map((p) => (
              <button key={p} type="button" className="learn-btn secondary full" onClick={() => setDraft(p)}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </LearnShell>
  );
}
