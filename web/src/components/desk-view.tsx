"use client";

import { useEffect, useState, type FormEvent } from "react";
import { listAgents } from "@/lib/agents";
import { UiBanner } from "@/components/ui-kit";
import { Mascot } from "@/components/mascot";
import type { Room, RoomPreview } from "@/components/aeko-app-types";
import type { AgentDef } from "@/lib/agents";
import type { FloraTab } from "@/components/flora-shell";
import { WorkHub } from "@/components/work-hub";
import { ComposerMenu, useComposerMenu } from "@/components/composer-menu";
import { WorkspaceTour } from "@/components/workspace-tour";
import { IconAttach, IconGlobe, IconSend, IconSparkle } from "@/components/ui-primitives";
import { todayTurns } from "@/lib/usage";

const STARTERS: { title: string; topic: string; kind: "channel" | "project" | "canvas"; how: string }[] = [
  { title: "Brief", topic: "Decisions, owners, and open questions.", kind: "channel", how: "Click the card. Then write the decision in the composer." },
  { title: "Research", topic: "Sources, pages, and what changed.", kind: "project", how: "Click the card. Then type @Hands search and the question." },
  { title: "Canvas", topic: "A shared note that stays in the room.", kind: "canvas", how: "Click the card. An agent can rewrite the note when you ask." },
  { title: "Build", topic: "Code, reviews, and patches.", kind: "channel", how: "Click the card. Type / and choose Run code, or @Reviewer." },
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
  onSettings,
  onCreateTask,
  onStartAgent,
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
  onInvite,
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
  onStartAgent: (id: string) => void;
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
  onInvite: () => void;
}) {
  const [roster, setRoster] = useState<AgentDef[]>([]);
  useEffect(() => {
    setRoster(listAgents());
  }, [tab]);
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
              <p className="desk-kicker">Encrypted workspace · {todayTurns()} turns today</p>
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
            onInvite={onInvite}
          />
          <label className="agent-field" data-tour="agent-field">
            <span>Agent</span>
            <select value={activeAgent.id} aria-label="Agent" onChange={(e) => onAgentSelect(e.target.value)}>
              {roster.map((agent) => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
              ))}
            </select>
          </label>
          <p className="fast-search" data-tour="fast-search">Fast search · Ctrl+K</p>
          <div className="desk-rooms" data-tour="rooms">
              {filteredRooms.map((r) => (
                <button key={r.id} type="button" className="flora-block room-card" onClick={() => onOpenRoom(r.id)}>
                  <Mascot size={28} />
                  <span className="room-copy">
                    <strong>{r.title}</strong>
                    <span>{previews[r.id]?.text || r.topic || "Quiet. The first note starts the thread."}</span>
                    <em>{[r.kind ?? "channel", formatTime(previews[r.id]?.lastAt ?? r.lastAt ?? 0)].filter(Boolean).join(" · ")}</em>
                  </span>
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
                  <em>{starter.how}</em>
                </button>
              ))}
            </div>
            <aside className="desk-aside" data-tour="guide">
              <p className="desk-kicker">How this desk works</p>
              <ul>
                <li><b>Composer.</b> Where: the field above. How: @ picks a bot, / picks a tool, Enter sends.</li>
                <li><b>Rooms.</b> Where: the cards. How: click one that says start. What: the thread for that work.</li>
                <li><b>Agent.</b> Where: the field under the composer. How: pick the bot, then type @ and the task.</li>
                <li><b>Fast search.</b> Press Ctrl+K on this page. It opens commands, rooms, and bots.</li>
                <li><b>People.</b> Where: Invite a person, after a room exists. What: a wrapped key to their email. They sign in once first.</li>
              </ul>
              <div className="desk-actions">
                <button type="button" className="flora-pill" onClick={onCreateTask}>Blank channel</button>
                <button type="button" className="flora-pill" onClick={onInvite}>Invite a person</button>
                <button type="button" className="flora-pill" onClick={() => onRunChip("@Hands what should we decide in this workspace?")}>Ask @Hands</button>
              </div>
            </aside>
        </div>
      ) : (
        <div className="desk-board work-board">
          <WorkHub
            rooms={filteredRooms}
            previews={previews}
            formatTime={formatTime}
            onOpenRoom={onOpenRoom}
            onCreate={onCreateTask}
            onStartAgent={onStartAgent}
            tab={tab}
            onTab={onTab}
            activeAgentId={activeAgent.id}
            onAgentSelect={onAgentSelect}
            roomId={roomId}
          />
        </div>
      )}
      <WorkspaceTour active={tab === "Home"} />
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
  onInvite,
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
  onInvite: () => void;
}) {
  const menu = useComposerMenu(deskDraft, onDeskDraft, [], onInvite);
  return (
    <div className="desk-composer-wrap" data-tour="composer">
      <form className="desk-composer" onSubmit={onSubmit}>
        <div className="desk-composer-icons">
          <button type="button" aria-label="Attach a file" title="Attach a file. The bot can read it in this browser." onClick={() => document.getElementById("desk-vault-file")?.click()}>
            <IconAttach />
          </button>
          <button type="button" className={webMode ? "on" : ""} aria-label="Web search" title="Web search. Hands may look up the web for this note." onClick={onWebMode}>
            <IconGlobe />
          </button>
          <button type="button" className={agentMode ? "on" : ""} aria-label="Agent mode" title="Agent mode. The bot may call tools." onClick={onAgentMode}>
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
        <div className="composer-input desk-composer-field">
          <ComposerMenu menu={menu.menu} active={menu.active} onActive={menu.setActive} onPick={menu.pick} />
          <input
            value={deskDraft}
            onChange={(e) => onDeskDraft(e.target.value)}
            placeholder="@ a bot or a person, / a tool, or write the first note"
            aria-label="Ask anything"
            onKeyDown={(e) => {
              menu.onKeyDown(e);
            }}
          />
        </div>
        <button className="sendbtn" type="submit" disabled={!deskDraft.trim()} aria-label="Send">
          <IconSend />
        </button>
      </form>
    </div>
  );
}
