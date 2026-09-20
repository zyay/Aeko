"use client";

import type { FormEvent, RefObject } from "react";
import { AgentOrb } from "@/components/agent-orb";
import { ToolTracePanel } from "@/components/activity-rail";
import { ThinkingOrb } from "@/components/thinking-orb";
import { Icon, Icons } from "@/components/icons";
import { IconBtn } from "@/components/ui-kit";
import type { BrainConfig, Line } from "@/components/aeko-app-types";
import type { AgentDef } from "@/lib/agents";
import {
  IconAttach,
  IconBack,
  IconFile,
  IconGlobe,
  IconSend,
  IconSettings,
  IconSparkle,
  MessageRow,
} from "@/components/ui-primitives";

const CHIPS = ["Summarize this", "Search the web", "Make a checklist", "Write code"];

export function ChatView({
  current,
  roomId,
  brain,
  activeAgent,
  members,
  messages,
  draft,
  busy,
  codeMode,
  agentMode,
  webMode,
  showAttach,
  enginePhase,
  sheet,
  bodyRef,
  onBack,
  onRename,
  onDelete,
  onCodeMode,
  onAgentMode,
  onSettings,
  onStop,
  onDraft,
  onTyping,
  onSubmit,
  onSend,
  onRunChip,
  onShowAttach,
  onWebMode,
  onFile,
  onContextMenu,
  onCloseSheet,
  onReply,
  onCopy,
  onRegenerate,
}: {
  current: string;
  roomId: string | null;
  brain: BrainConfig;
  activeAgent: AgentDef;
  members: string[];
  messages: Line[];
  draft: string;
  busy: boolean;
  codeMode: boolean;
  agentMode: boolean;
  webMode: boolean;
  showAttach: boolean;
  enginePhase: "idle" | "thinking" | "speaking";
  sheet: Line | null;
  bodyRef: RefObject<HTMLDivElement>;
  onBack: () => void;
  onRename: () => void;
  onDelete: () => void;
  onCodeMode: () => void;
  onAgentMode: () => void;
  onSettings: () => void;
  onStop: () => void;
  onDraft: (v: string) => void;
  onTyping: (active: boolean) => void;
  onSubmit: (e: FormEvent) => void;
  onSend: () => void;
  onRunChip: (text: string) => void;
  onShowAttach: () => void;
  onWebMode: () => void;
  onFile: (file: File) => void;
  onContextMenu: (line: Line) => void;
  onCloseSheet: () => void;
  onReply: (line: Line) => void;
  onCopy: (line: Line) => void;
  onRegenerate: (line: Line) => void;
}) {
  return (
    <div className="chat-overlay">
      <div className="thread-head">
        <button className="iconbtn" type="button" aria-label="Back to dashboard" onClick={onBack}>
          <IconBack />
        </button>
        <AgentOrb state={enginePhase} size={48} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong>{current}</strong>
          <div className="thread-meta">
            {busy ? `${activeAgent.name} · ${enginePhase}` : `${activeAgent.name} · ${brain.valid ? "Live" : "Needs model"}`}
            {members.length > 1 ? ` · ${members.length} people` : ""}
          </div>
          {members.length > 0 && <div className="thread-members">{members.map((m) => m.split("@")[0]).join(", ")}</div>}
        </div>
        {roomId && (
          <>
            <IconBtn label="Rename task" onClick={onRename}>
              <Icon icon={Icons.task} size={16} aria-hidden />
            </IconBtn>
            <IconBtn label="Delete task" danger onClick={onDelete}>
              <Icon icon={Icons.trash} size={16} aria-hidden />
            </IconBtn>
          </>
        )}
        <div className="thread-head-actions">
          <button type="button" className={codeMode ? "head-chip on" : "head-chip"} onClick={onCodeMode}>
            Code
          </button>
          <button type="button" className={agentMode ? "head-chip on" : "head-chip"} onClick={onAgentMode}>
            Agent
          </button>
          <button type="button" className="iconbtn" aria-label="Settings" onClick={onSettings}>
            <IconSettings />
          </button>
          {busy && (
            <button type="button" className="stopbtn" onClick={onStop}>
              Stop
            </button>
          )}
        </div>
      </div>

      <div className="thread-body" ref={bodyRef}>
        <div className="thread-body-inner">
          {messages.length === 0 && (
            <div className="empty-chat">
              <AgentOrb state={busy ? enginePhase : "idle"} size={72} />
              <h3>Start the conversation</h3>
              <p>Ask for summaries, code, research, or attach a file from the toolbar below.</p>
            </div>
          )}
          {messages.map((m) => (
            <MessageRow key={m.id} line={m} busy={busy} onContextMenu={(e) => { e.preventDefault(); onContextMenu(m); }} />
          ))}
          <ToolTracePanel lines={messages} />
          {busy && enginePhase === "thinking" && <ThinkingOrb />}
        </div>
      </div>

      <div className="composer-dock">
        <div className="composer-dock-inner">
          <div className="chips">
            {CHIPS.map((c) => (
              <button key={c} type="button" className="chip" onClick={() => onRunChip(c)}>
                {c}
              </button>
            ))}
          </div>
          <form className="composer" onSubmit={onSubmit}>
            <div className="composer-tools">
              <button type="button" aria-label="Attach" onClick={onShowAttach}>
                <IconAttach />
              </button>
              {showAttach && (
                <button type="button" aria-label="File" onClick={() => document.getElementById("vault-file")?.click()}>
                  <IconFile />
                </button>
              )}
              <button type="button" className={webMode ? "on" : ""} aria-label="Web search" onClick={onWebMode}>
                <IconGlobe />
              </button>
              <button type="button" className={agentMode ? "on" : ""} aria-label="Agent mode" onClick={onAgentMode}>
                <IconSparkle />
              </button>
            </div>
            <input
              id="vault-file"
              type="file"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onFile(file);
              }}
            />
            <div className="composer-input">
              <textarea
                value={draft}
                onChange={(e) => {
                  onDraft(e.target.value);
                  onTyping(true);
                }}
                placeholder={agentMode ? "Message agent… (@aeko to invoke)" : "Message team… (turn on Agent to invoke AI)"}
                rows={1}
                aria-label="Message"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSend();
                  }
                }}
              />
            </div>
            <button className="sendbtn" type="submit" disabled={!draft.trim() || busy} aria-label="Send">
              <IconSend />
            </button>
          </form>
        </div>
      </div>

      {sheet && (
        <div className="sheet-bg" onClick={onCloseSheet} role="presentation">
          <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Message actions">
            <button className="row" type="button" onClick={() => onReply(sheet)}>
              Reply
            </button>
            <button className="row" type="button" onClick={() => onCopy(sheet)}>
              Copy
            </button>
            {sheet.role === "aeko" && (
              <button className="row" type="button" onClick={() => onRegenerate(sheet)}>
                Regenerate
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
