"use client";

import type { FormEvent } from "react";
import { UiBanner } from "@/components/ui-kit";
import type { Room, RoomPreview } from "@/components/aeko-app-types";
import type { AgentDef } from "@/lib/agents";
import type { FloraTab } from "@/components/flora-shell";
import { WorkHub } from "@/components/work-hub";
import { IconAttach, IconGlobe, IconSend, IconSparkle } from "@/components/ui-primitives";

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
        <>
          <p className="flora-hint">
            <b>Double-click</b> anywhere to open a channel, or start with…
          </p>
          <div className="flora-pills">
            <button type="button" className="flora-pill" onClick={onCreateTask}>New channel</button>
            <button type="button" className="flora-pill" onClick={() => { if (!webMode) onWebMode(); onDeskDraft(deskDraft || "Search the web for "); }}>Search the web</button>
            <button type="button" className="flora-pill" onClick={() => onTab("Agents")}>Ask an agent</button>
            <button type="button" className="flora-pill" onClick={() => onRunChip("Make a checklist for this workspace")}>Make a checklist</button>
            <button type="button" className="flora-pill" onClick={() => onTab("Workflows")}>Workflows</button>
            <button type="button" className="flora-pill" onClick={onPalette}>…</button>
          </div>
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
          {filteredRooms.length > 0 && (
            <div className="flora-blocks">
              {filteredRooms.map((r) => (
                <button key={r.id} type="button" className="flora-block" onClick={() => onOpenRoom(r.id)}>
                  <strong>{r.title}</strong>
                  <span>{previews[r.id]?.text || r.topic || "No messages yet"}</span>
                  <em>{r.kind ?? "channel"} · {formatTime(previews[r.id]?.lastAt ?? r.lastAt ?? 0)}</em>
                </button>
              ))}
            </div>
          )}
        </>
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
          placeholder="Ask Aeko anything…"
          aria-label="Ask anything"
        />
        <button className="sendbtn" type="submit" disabled={!deskDraft.trim() || busy} aria-label="Send">
          <IconSend />
        </button>
      </form>
    </div>
  );
}
