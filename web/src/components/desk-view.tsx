"use client";

import type { FormEvent } from "react";
import { UiBanner } from "@/components/ui-kit";
import { Mascot } from "@/components/mascot";
import type { Room, RoomPreview } from "@/components/aeko-app-types";
import type { AgentDef } from "@/lib/agents";
import type { FloraTab } from "@/components/flora-shell";
import { WorkHub } from "@/components/work-hub";
import { IconAttach, IconGlobe, IconSend, IconSparkle } from "@/components/ui-primitives";

const STARTERS: { title: string; topic: string; kind: "channel" | "project" | "canvas" }[] = [
  { title: "Brief", topic: "Decisions, owners, and open questions", kind: "channel" },
  { title: "Research", topic: "Sources, pages, and what changed", kind: "project" },
  { title: "Canvas", topic: "Shared notes that stay in the room", kind: "canvas" },
  { title: "Build", topic: "Code, reviews, and patches", kind: "channel" },
];

export function DeskView({
  activeAgent,
  filteredRooms,
  previews,
  needsKey,
  durable,
  status,
  deskDraft,
  busy,
  webMode,
  agentMode,
  formatTime,
  onDeskDraft,
  onSubmit,
  onPalette,
  onSettings,
  onCreateTask,
  onOpenRoom,
  onRunChip,
  onWebMode,
  onAgentMode,
  onFile,
  onCreateChannel,
  tab,
  onTab,
  onAgentSelect,
  roomId,
}: {
  activeAgent: AgentDef;
  filteredRooms: Room[];
  previews: Record<string, RoomPreview>;
  needsKey: boolean;
  durable: boolean | null;
  status: string;
  deskDraft: string;
  busy: boolean;
  webMode: boolean;
  agentMode: boolean;
  formatTime: (ts: number) => string;
  onDeskDraft: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  onPalette: () => void;
  onSettings: () => void;
  onCreateTask: () => void;
  onOpenRoom: (id: string) => void;
  onRunChip: (text: string) => void;
  onWebMode: () => void;
  onAgentMode: () => void;
  onFile: (file: File) => void;
  onCreateChannel: (input: { title: string; topic: string; kind: "channel" | "dm" | "project" | "canvas"; visibility: "open" | "private" }) => void;
  tab: FloraTab;
  onTab: (tab: FloraTab) => void;
  onAgentSelect: (id: string) => void;
  roomId: string | null;
}) {
  return (
    <div
      className="flora-center"
      onDoubleClick={(e) => {
        if (e.target === e.currentTarget) onCreateTask();
      }}
    >
      {needsKey && (
        <UiBanner tone="warn" action={<button type="button" className="ghostlink" style={{ padding: 0, color: "var(--flora-text)" }} onClick={onSettings}>Open settings</button>}>
          Connect an API key to chat with your model.
        </UiBanner>
      )}
      {durable === false && <UiBanner tone="warn">Cloud tasks need DATABASE_URL on Vercel to persist.</UiBanner>}
      {status && <UiBanner>{status}</UiBanner>}

      {tab === "Home" ? (
        <div className="desk-board">
          <header className="desk-lead">
            <Mascot size={36} />
            <div>
              <p className="desk-kicker">Encrypted workspace</p>
              <h1>People and agents. One room.</h1>
              <p>Messages stay on the device. Mention a bot, or open a channel and write the note there.</p>
            </div>
          </header>
          <DeskComposer
            deskDraft={deskDraft}
            busy={busy}
            webMode={webMode}
            agentMode={agentMode}
            onDeskDraft={onDeskDraft}
            onSubmit={onSubmit}
            onWebMode={onWebMode}
            onAgentMode={onAgentMode}
            onFile={onFile}
          />
          <div className="desk-grid">
            <div className="desk-rooms">
              {filteredRooms.map((r) => (
                <button key={r.id} type="button" className="flora-block" onClick={() => onOpenRoom(r.id)}>
                  <strong>{r.title}</strong>
                  <span>{previews[r.id]?.text || r.topic || "Quiet. The first note starts the thread."}</span>
                  <em>{r.kind ?? "channel"} · {formatTime(previews[r.id]?.lastAt ?? r.lastAt ?? 0)}</em>
                </button>
              ))}
              {STARTERS.filter((starter) => !filteredRooms.some((room) => room.title === starter.title)).map((starter) => (
                <button
                  key={starter.title}
                  type="button"
                  className="flora-block ghost"
                  onClick={() => onCreateChannel({ title: starter.title, topic: starter.topic, kind: starter.kind, visibility: "private" })}
                >
                  <strong>{starter.title}</strong>
                  <span>{starter.topic}</span>
                  <em>Start this room</em>
                </button>
              ))}
            </div>
            <aside className="desk-aside">
              <p className="desk-kicker">In the room</p>
              <ul>
                <li><b>@Hands</b> searches, opens a page, then answers from what it read.</li>
                <li><b>Canvas</b> is a shared note. An agent can rewrite it into the channel.</li>
                <li><b>Skills</b> are read when you name them, pin them, or type /.</li>
                <li><b>Keys</b> never leave this browser. The server stores ciphertext.</li>
              </ul>
              <button type="button" className="flora-pill" onClick={onCreateTask}>Blank channel</button>
              <button type="button" className="flora-pill" onClick={() => onRunChip("@Hands what should we decide in this workspace?")}>Ask @Hands</button>
              <button type="button" className="flora-pill" onClick={onPalette}>Search commands</button>
            </aside>
          </div>
        </div>
      ) : (
        <div className="flora-sheet">
          <WorkHub
            rooms={filteredRooms}
            previews={previews}
            formatTime={formatTime}
            onOpenRoom={onOpenRoom}
            onCreate={onCreateTask}
            tab={tab}
            onTab={onTab}
            activeAgentId={activeAgent.id}
            onAgentSelect={onAgentSelect}
            roomId={roomId}
          />
        </div>
      )}
    </div>
  );
}

export function DeskComposer({
  deskDraft,
  busy,
  webMode,
  agentMode,
  onDeskDraft,
  onSubmit,
  onWebMode,
  onAgentMode,
  onFile,
}: {
  deskDraft: string;
  busy: boolean;
  webMode: boolean;
  agentMode: boolean;
  onDeskDraft: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  onWebMode: () => void;
  onAgentMode: () => void;
  onFile: (file: File) => void;
}) {
  return (
    <div className="desk-composer-wrap">
      <form className="desk-composer" onSubmit={onSubmit}>
        <div className="desk-composer-icons">
          <button type="button" aria-label="Attach" onClick={() => document.getElementById("desk-vault-file")?.click()}>
            <IconAttach />
          </button>
          <button type="button" className={webMode ? "on" : ""} aria-label="Web search" onClick={onWebMode}>
            <IconGlobe />
          </button>
          <button type="button" className={agentMode ? "on" : ""} aria-label="Agent mode" onClick={onAgentMode}>
            <IconSparkle />
          </button>
        </div>
        <input
          id="desk-vault-file"
          type="file"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
          }}
        />
        <input
          value={deskDraft}
          onChange={(e) => onDeskDraft(e.target.value)}
          placeholder="Ask @Hands, or write the first note…"
          aria-label="Ask anything"
        />
        <button className="sendbtn" type="submit" disabled={!deskDraft.trim() || busy} aria-label="Send">
          <IconSend />
        </button>
      </form>
    </div>
  );
}
