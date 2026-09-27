"use client";

import type { FormEvent, RefObject } from "react";
import { ToolTracePanel } from "@/components/activity-rail";
import { ThinkingOrb } from "@/components/thinking-orb";
import { Icon, Icons } from "@/components/icons";
import { IconBtn } from "@/components/ui-kit";
import { Mascot } from "@/components/mascot";
import type { BrainConfig, Line } from "@/components/aeko-app-types";
import type { AgentDef } from "@/lib/agents";
import { ComposerMenu, useComposerMenu } from "@/components/composer-menu";
import { ChannelExtras } from "@/components/channel-extras";
import { AgentLane, ShareGate } from "@/components/agent-lane";
import type { AgentPrefs, AgentTurn, ShareMode } from "@/lib/room-policy";
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

const CHIPS: { label: string; title: string; text: string }[] = [
  { label: "Hands · search", title: "Hands searches the web, then answers from what it found.", text: "@Hands search the web for what matters here, then open the best page." },
  { label: "Writer · brief", title: "Writer drafts a short brief and leads with decisions.", text: "@Writer draft a short brief for this channel. Lead with decisions." },
  { label: "Reviewer · risk", title: "Reviewer leads with the highest risk.", text: "@Reviewer look for the highest risk in what we have so far." },
  { label: "Hands · apps", title: "Hands lists connected apps and recent GitHub repos if GitHub is connected.", text: "@Hands list my connected apps. If GitHub is connected, list my recent repos." },
];

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
  replyParent = null,
  onClearReply,
  onShareRecord,
  onInvite,
  agentOpen = false,
  agentNote = "",
  agentLog = [],
  shareAsk = false,
  shareMode = null,
  steer = "",
  agentPrefs,
  onOpenAgent,
  onCloseAgent,
  onChooseShare,
  onSteerDraft,
  onSteer,
  onAgentPrefs,
  onPublishAnswer,
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
  onInvite?: () => void;
  agentOpen?: boolean;
  agentNote?: string;
  agentLog?: AgentTurn[];
  shareAsk?: boolean;
  shareMode?: ShareMode | null;
  steer?: string;
  agentPrefs?: AgentPrefs;
  onOpenAgent?: () => void;
  onCloseAgent?: () => void;
  onChooseShare?: (mode: ShareMode) => void;
  onSteerDraft?: (text: string) => void;
  onSteer?: (text: string) => void;
  onAgentPrefs?: (prefs: AgentPrefs) => void;
  onPublishAnswer?: (text: string) => void;
}) {
  const menu = useComposerMenu(draft, onDraft, members, onInvite);
  return (
    <div className="chat-overlay">
      <div className="thread-head">
        <button className="iconbtn" type="button" aria-label="Back to dashboard" onClick={onBack}>
          <IconBack />
        </button>
        <Mascot size={48} label={activeAgent.name} />
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
          <button type="button" className={codeMode ? "head-chip on" : "head-chip"} title="Code mode. The bot may write and run code in this browser." onClick={onCodeMode}>
            Code
          </button>
          <button type="button" className={agentOpen ? "head-chip on" : "head-chip"} title="Open the private agent thread. People in the room do not see it." onClick={onOpenAgent}>
            Agent thread
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

      {agentNote && <p className="agent-banner">{agentNote}</p>}
      <ShareGate open={shareAsk} saved={shareMode} onChoose={(mode) => onChooseShare?.(mode)} />
      <AgentLane
        open={agentOpen}
        agent={activeAgent}
        note={agentNote}
        turns={agentLog}
        prefs={agentPrefs ?? { model: "", context: true, fast: false, thinking: false }}
        steer={steer}
        busy={busy}
        onClose={() => onCloseAgent?.()}
        onSteer={(text) => onSteer?.(text)}
        onDraft={(text) => onSteerDraft?.(text)}
        onPrefs={(prefs) => onAgentPrefs?.(prefs)}
        onShareResult={(text) => onPublishAnswer?.(text)}
      />
      <div className="thread-body" ref={bodyRef}>
        <div className="thread-body-inner">
          {messages.length === 0 && (
            <div className="channel-start">
              <div>
                <Mascot size={40} />
                <p className="desk-kicker">{activeAgent.name}</p>
                <h2>{current || "This channel"}</h2>
                <p>Notes here go to the people in the room. @Name runs that bot in a private thread they cannot see.</p>
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
                <button type="button" title="Reply in a thread under this note" onClick={() => onReply(m)}>Reply</button>
                <button type="button" title="Hands searches and can use a connected app on this note" onClick={() => onRunChip(`@Hands use this note and say the next step:\n${m.text.slice(0, 500)}`)}>Hands</button>
                <button type="button" title="Writer turns this note into a short brief" onClick={() => onRunChip(`@Writer turn this into a short brief:\n${m.text.slice(0, 500)}`)}>Writer</button>
                <button type="button" title="Reviewer names the highest risk in this note" onClick={() => onRunChip(`@Reviewer name the highest risk in this:\n${m.text.slice(0, 500)}`)}>Reviewer</button>
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
              <button key={c.label} type="button" className="chip" title={c.title} onClick={() => onRunChip(c.text)}>
                {c.label}
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
              <button type="button" aria-label="Attach a file. The bot can read it in this browser." title="Attach a file. The bot can read it in this browser." onClick={onShowAttach}>
                <IconAttach />
              </button>
              {showAttach && (
                <button type="button" aria-label="Choose a file" title="Choose a file" onClick={() => document.getElementById("vault-file")?.click()}>
                  <IconFile />
                </button>
              )}
              <button type="button" className={webMode ? "on" : ""} aria-label="Web search. Hands may look up the web for this message." title="Web search. Hands may look up the web for this message." onClick={onWebMode}>
                <IconGlobe />
              </button>
              <button type="button" className={agentMode ? "on" : ""} aria-label="Agent mode. The bot may call tools." title="Agent mode. The bot may call tools." onClick={onAgentMode}>
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
              <ComposerMenu menu={menu.menu} active={menu.active} onActive={menu.setActive} onPick={menu.pick} />
              <textarea
                value={draft}
                onChange={(e) => {
                  onDraft(e.target.value);
                  onTyping(true);
                }}
                placeholder="Write to the person. @Name runs that bot in the private thread."
                rows={1}
                aria-label="Message"
                onKeyDown={(e) => {
                  if (menu.onKeyDown(e)) return;
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSend();
                  }
                }}
              />
            </div>
            <button className="sendbtn" type="submit" disabled={!draft.trim()} aria-label="Send">
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
