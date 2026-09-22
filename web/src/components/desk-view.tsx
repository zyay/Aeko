"use client";

import type { FormEvent, RefObject } from "react";
import { GlowCard } from "@/components/glow-card";
import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState, KbdHint, Panel, UiBanner } from "@/components/ui-kit";
import type { BrainConfig, Line, Room, RoomPreview, View } from "@/components/aeko-app-types";
import type { AgentDef } from "@/lib/agents";
import { computeStreak, hasProfile } from "@/lib/learn-store";
import { WorkHub } from "@/components/work-hub";
import {
  BrandMark,
  IconAttach,
  IconBrain,
  IconGlobe,
  IconPlus,
  IconSearch,
  IconSend,
  IconSettings,
  IconSparkle,
  IconTask,
  IconTeam,
  taskColor,
} from "@/components/ui-primitives";

const CHIPS = ["Summarize this", "Search the web", "Make a checklist", "Write code"];

export function DeskView({
  userEmail,
  brain,
  activeAgent,
  rooms,
  filteredRooms,
  featured,
  featuredPreview,
  previews,
  needsKey,
  durable,
  status,
  deskDraft,
  busy,
  webMode,
  agentMode,
  localMode,
  formatTime,
  onDeskDraft,
  onSubmit,
  onPalette,
  onSettings,
  onCreateTask,
  onInvite,
  onOpenRoom,
  onRunChip,
  onWebMode,
  onAgentMode,
  onFile,
}: {
  userEmail: string;
  brain: BrainConfig;
  activeAgent: AgentDef;
  rooms: Room[];
  filteredRooms: Room[];
  featured: Room | undefined;
  featuredPreview: string;
  previews: Record<string, RoomPreview>;
  needsKey: boolean;
  durable: boolean | null;
  status: string;
  deskDraft: string;
  busy: boolean;
  webMode: boolean;
  agentMode: boolean;
  localMode: boolean;
  formatTime: (ts: number) => string;
  onDeskDraft: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  onPalette: () => void;
  onSettings: () => void;
  onCreateTask: () => void;
  onInvite: () => void;
  onOpenRoom: (id: string) => void;
  onRunChip: (text: string) => void;
  onWebMode: () => void;
  onAgentMode: () => void;
  onFile: (file: File) => void;
}) {
  const [learnStreak, setLearnStreak] = useState(0);
  useEffect(() => {
    if (hasProfile()) setLearnStreak(computeStreak());
  }, []);

  return (
    <div className="workspace-main">
      <header className="workspace-topbar">
        <div className="topbar-left">
          <BrandMark size={24} />
          <span className="workspace-account">{userEmail}</span>
        </div>
        <div className="workspace-topbar-links">
          <button type="button" onClick={onPalette}>
            <IconSearch size={14} /> Search
          </button>
          <button type="button" onClick={onSettings}>
            <IconSettings /> Settings
          </button>
          <button type="button" className="primary-link" onClick={onCreateTask}>
            <IconPlus /> New task
          </button>
          {!localMode && (
            <button type="button" className="primary-link" onClick={onInvite}>
              Invite
            </button>
          )}
        </div>
      </header>

      {needsKey && (
        <UiBanner tone="warn" action={<button type="button" className="ghostlink" style={{ padding: 0, color: "var(--accent)" }} onClick={onSettings}>Open settings</button>}>
          Connect an API key to chat with your model.
        </UiBanner>
      )}
      {durable === false && <UiBanner tone="warn">Cloud tasks need DATABASE_URL on Vercel to persist.</UiBanner>}
      {status && <UiBanner>{status}</UiBanner>}

      <div className="workspace-scroll">
        <div className="workspace-hero">
          <p className="hero-kicker">Intelligent workspace</p>
          <h1 className="text-gradient">What should Aeko handle?</h1>
          <form className="hero-search" onSubmit={onSubmit}>
            <IconSearch size={18} />
            <input
              value={deskDraft}
              onChange={(e) => onDeskDraft(e.target.value)}
              placeholder="Ask anything, draft a plan, or start a task…"
              aria-label="Search or ask"
            />
            <KbdHint onClick={onPalette}>Ctrl K</KbdHint>
          </form>
        </div>

        <div className="cf-cards">
          <GlowCard as="button" type="button" className="cf-card" beam={false} onClick={onCreateTask}>
            <div className="cf-card-icon"><IconTask size={18} /></div>
            <h3>Start a task</h3>
            <p>Open a focused room for your team and agents with shared context.</p>
            <span className="cf-card-action">Create task</span>
          </GlowCard>
          <GlowCard as="button" type="button" className="cf-card" beam={false} onClick={onSettings}>
            <div className="cf-card-icon"><IconBrain size={18} /></div>
            <h3>Connect your model</h3>
            <p>Bring your OpenAI-compatible API or local inference server.</p>
            <span className="cf-card-action">{brain.valid ? "Connected" : "Configure"}</span>
          </GlowCard>
          <Link href="/learn/plan" style={{ textDecoration: "none", color: "inherit" }}>
            <GlowCard as="div" className="cf-card" beam={false}>
              <div className="cf-card-icon"><IconTeam size={18} /></div>
              <h3>abc — Learn English</h3>
              <p>Skills hub, MCP studio, GPT chat{learnStreak > 0 ? ` · ${learnStreak} day streak` : ""}.</p>
              <span className="cf-card-action">Open /learn</span>
            </GlowCard>
          </Link>
          <GlowCard as="button" type="button" className="cf-card" beam={false} onClick={onInvite}>
            <div className="cf-card-icon"><IconTeam size={18} /></div>
            <h3>Invite collaborators</h3>
            <p>Add people to encrypted rooms and keep humans plus agents aligned.</p>
            <span className="cf-card-action">Send invite</span>
          </GlowCard>
        </div>

        <WorkHub rooms={filteredRooms} onOpenRoom={onOpenRoom} />

        <GlowCard
          as="button"
          type="button"
          className="spotlight-card"
          onClick={() => (featured ? onOpenRoom(featured.id) : onCreateTask())}
        >
          <div className="spotlight-kicker">
            <IconSparkle /> Suggested
          </div>
          <h2>{featured?.title ?? "Start your first task"}</h2>
          <p>{featuredPreview}</p>
          <div className="spotlight-meta">
            {featured ? formatTime(previews[featured.id]?.lastAt ?? featured.lastAt ?? 0) : "Tap to begin"}
          </div>
        </GlowCard>

        <Panel title="Active agent" subtitle={activeAgent.tagline}>
          <div className="agent-active-row">
            <img src={activeAgent.avatar} alt="" className="agent-active-avatar" />
            <div>
              <strong>{activeAgent.name}</strong>
              <p>{activeAgent.tools.join(" · ")} tools · real web search &amp; fetch when your model is connected</p>
            </div>
          </div>
        </Panel>

        <Panel
          title="Tasks"
          subtitle={`${rooms.length} conversation${rooms.length === 1 ? "" : "s"}`}
          action={
            <button type="button" className="primary-link" onClick={onCreateTask}>
              <IconPlus /> New
            </button>
          }
        >
          {rooms.length === 0 ? (
            <EmptyState
              title="No tasks yet"
              body="Create a task or ask Aeko anything from the composer below."
              action={
                <button type="button" className="primary-link" onClick={onCreateTask}>
                  <IconPlus /> Create task
                </button>
              }
            />
          ) : (
            filteredRooms.map((r) => (
              <button key={r.id} type="button" className="task-list-row" onClick={() => onOpenRoom(r.id)}>
                <div className="task-dot" style={{ background: taskColor(r.id) }}>
                  {r.title[0]?.toUpperCase()}
                </div>
                <div className="task-list-copy">
                  <strong>{r.title}</strong>
                  <span>{previews[r.id]?.text || "No messages yet"}</span>
                </div>
                <span className="task-list-meta">{formatTime(previews[r.id]?.lastAt ?? r.lastAt ?? 0)}</span>
              </button>
            ))
          )}
        </Panel>

        <Panel title="Quick prompts" subtitle="One tap to start">
          <div className="suggest-chips" style={{ padding: "8px 12px 14px" }}>
            {CHIPS.map((c) => (
              <button key={c} type="button" className="suggest-chip" onClick={() => onRunChip(c)}>
                {c}
              </button>
            ))}
          </div>
        </Panel>
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
