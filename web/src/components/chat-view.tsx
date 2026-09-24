"use client";

import type { FormEvent, RefObject } from "react";
import { AgentOrb } from "@/components/agent-orb";
import { ToolTracePanel } from "@/components/activity-rail";
import { ThinkingOrb } from "@/components/thinking-orb";
import { Icon, Icons } from "@/components/icons";
import { IconBtn } from "@/components/ui-kit";
import { Mascot } from "@/components/mascot";
import type { BrainConfig, Line } from "@/components/aeko-app-types";
import { listAgents, mentionQuery, type AgentDef } from "@/lib/agents";
import { listInstalledSkills, skillQuery } from "@/lib/skill-context";
import { ChannelExtras } from "@/components/channel-extras";
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

const CHIPS = ["@Hands research", "@Writer brief", "@Hands apps", "Write code"];

const STARTS = [
  { title: "Research", text: "@Hands search the web for what matters here, then open the best page." },
  { title: "Brief", text: "@Writer draft a short brief for this channel. Lead with decisions." },
  { title: "Canvas", text: "@Editor read the channel document and tighten it." },
  { title: "Review", text: "@Reviewer look for the highest risk in what we have so far." },
];

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
  reactions = [],
  replyParent = null,
  onReact,
  onClearReply,
  onShareRecord,
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
  reactions?: { messageId: string; emoji: string }[];
  replyParent?: string | null;
  onReact?: (messageId: string, emoji: string) => void;
  onClearReply?: () => void;
  onShareRecord?: (plaintext: string) => void;
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
          <div className="data-mode">
            {/localhost|127\.0\.0\.1/.test(brain.baseUrl)
              ? "Local model. Prompts stay on this machine."
              : "Cloud model. The provider sees the prompt. Room keys stay on your devices."}
          </div>
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
            <div className="channel-start">
              <div>
                <Mascot size={40} />
                <p className="desk-kicker">{activeAgent.name}</p>
                <h2>{current || "This channel"}</h2>
                <p>The thread is empty. A mention runs that bot. Notes in the canvas stay encrypted with the room.</p>
              </div>
              <div className="start-grid">
                {STARTS.map((item) => (
                  <button key={item.title} type="button" className="flora-block" onClick={() => onRunChip(item.text)}>
                    <strong>{item.title}</strong>
                    <span>{item.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.filter((m) => !m.parentId && !m.record).map((m) => (
            <div key={m.id}>
              <MessageRow line={m} busy={busy} onContextMenu={(e) => { e.preventDefault(); onContextMenu(m); }} />
              <div className="msg-actions">
                <button type="button" onClick={() => onReply(m)}>Reply</button>
                {["👍", "✅", "👀"].map((emoji) => (
                  <button key={emoji} type="button" onClick={() => onReact?.(m.id, emoji)}>
                    {emoji} {reactions.filter((r) => r.messageId === m.id && r.emoji === emoji).length || ""}
                  </button>
                ))}
              </div>
              {messages.filter((r) => r.parentId === m.id).map((r) => (
                <div key={r.id} className="thread-reply">
                  <MessageRow line={r} busy={busy} onContextMenu={(e) => { e.preventDefault(); onContextMenu(r); }} />
                </div>
              ))}
            </div>
          ))}
          {roomId && onShareRecord && <ChannelExtras roomId={roomId} messages={messages} onShare={onShareRecord} />}
          <ToolTracePanel lines={messages} />
          {busy && enginePhase === "thinking" && <ThinkingOrb />}
        </div>
      </div>

      <div className="composer-dock">
        <div className="composer-dock-inner">
          <div className="chips">
            {CHIPS.map((c) => (
              <button key={c} type="button" className="chip" onClick={() => onRunChip(c === "@Hands research" ? "@Hands search the web for what matters here, then open the best page." : c === "@Writer brief" ? "@Writer draft a short brief for this channel. Lead with decisions." : c === "@Hands apps" ? "@Hands list my connected apps. If GitHub is connected, list my recent repos." : c)}>
                {c}
              </button>
            ))}
          </div>
          {replyParent && (
            <div className="reply-banner">
              Replying in thread
              <button type="button" onClick={onClearReply}>Cancel</button>
            </div>
          )}
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
              {skillQuery(draft) !== null && (
                <div className="mention-pop" role="listbox" aria-label="Skills">
                  {listInstalledSkills()
                    .filter((s) => s.name.toLowerCase().includes(skillQuery(draft) || "") || s.id.includes(skillQuery(draft) || ""))
                    .slice(0, 6)
                    .map((s) => (
                      <button key={s.id} type="button" onClick={() => onDraft(draft.replace(/(?:^|\s)\/([a-z0-9 -]*)$/i, ` ${s.name} `).trimStart())}>
                        {s.name}
                        <span>{s.description}</span>
                      </button>
                    ))}
                  {listInstalledSkills().length === 0 && <p>Install a skill from the desk Skills tab, then type /.</p>}
                </div>
              )}
              {mentionQuery(draft) !== null && (
                <div className="mention-pop" role="listbox" aria-label="Agents">
                  {listAgents().filter((a) => a.name.toLowerCase().includes(mentionQuery(draft) || "") || a.id.includes(mentionQuery(draft) || "")).map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => onDraft(draft.replace(/@([a-z0-9 -]*)$/i, `@${a.name} `))}
                    >
                      @{a.name}
                      <span>{a.tagline}</span>
                    </button>
                  ))}
                </div>
              )}
              <textarea
                value={draft}
                onChange={(e) => {
                  onDraft(e.target.value);
                  onTyping(true);
                }}
                placeholder="Message the channel. @Hands, @Writer, or / for a skill"
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
