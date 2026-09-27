"use client";

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { listAgents, mentionQuery } from "@/lib/agents";
import { listInstalledSkills, skillQuery } from "@/lib/skill-context";

export type MenuRow = {
  id: string;
  kicker: string;
  title: string;
  detail: string;
  insert: string;
};

const TOOLS: MenuRow[] = [
  { id: "search", kicker: "Tool", title: "Search", detail: "Hands searches the web, then answers from the pages it found.", insert: "@Hands search " },
  { id: "page", kicker: "Tool", title: "Open a page", detail: "Hands opens one https link and reads it before answering.", insert: "@Hands open https://" },
  { id: "code", kicker: "Tool", title: "Run code", detail: "Code Runner runs the javascript you put in a fenced block.", insert: "@Code Runner\n```js\n\n```" },
  { id: "apps", kicker: "Tool", title: "Connected apps", detail: "Hands lists GitHub, Linear, Notion, or Slack when that token is connected.", insert: "@Hands list my connected apps. " },
  { id: "files", kicker: "Tool", title: "Read a file", detail: "The bot reads the file attached in this browser. It is not uploaded as a room message.", insert: "@Hands read the attached file and summarize it. " },
  { id: "doc", kicker: "Tool", title: "Rewrite the note", detail: "The bot rewrites the channel canvas and puts the new text back in the room.", insert: "@Hands rewrite the channel note. " },
  { id: "jev", kicker: "Decision", title: "Jev", detail: "TypeSafe Jev scores a next step, a risk, and whether the situation is clear. It does not write a chat reply.", insert: "@Jev " },
];

export function menuFor(draft: string, people: string[] = []): { label: string; rows: MenuRow[] } | null {
  const at = mentionQuery(draft);
  if (at !== null) {
    const agents = listAgents()
      .filter((agent) => agent.name.toLowerCase().includes(at) || agent.id.includes(at) || agent.tagline.toLowerCase().includes(at))
      .map((agent) => ({
        id: agent.id,
        kicker: agent.kind === "decision" ? "Decision" : "Agent",
        title: `@${agent.name}`,
        detail: agent.kind === "decision"
          ? "Scores a next step, a risk, and a yes or no. It does not write a chat reply."
          : `${agent.tagline}. In a channel, type @${agent.name} and the task.`,
        insert: `@${agent.name} `,
      }));
    const members = people
      .filter((email) => email.toLowerCase().includes(at))
      .map((email) => ({
        id: `person-${email}`,
        kicker: "Person",
        title: email,
        detail: "Already in this room. Messages they can read stay encrypted for members.",
        insert: "",
      }));
    const invite: MenuRow = {
      id: "invite",
      kicker: "Person",
      title: "Invite someone",
      detail: "They sign in once, then you send a wrapped room key to their email.",
      insert: "",
    };
    const rows = [...agents, ...members, invite].filter((row) => row.id === "invite" || row.title.toLowerCase().includes(at) || row.detail.toLowerCase().includes(at) || at === "");
    return { label: "Mention", rows };
  }
  const slash = skillQuery(draft);
  if (slash !== null) {
    const tools = TOOLS.filter((tool) => tool.title.toLowerCase().includes(slash) || tool.id.includes(slash));
    const skills = listInstalledSkills()
      .filter((skill) => skill.name.toLowerCase().includes(slash) || skill.id.includes(slash))
      .map((skill) => ({
        id: skill.id,
        kicker: "Skill",
        title: skill.name,
        detail: skill.description || "Installed skill. The bot can read it when you name it.",
        insert: `${skill.name} `,
      }));
    return { label: "Tools", rows: [...tools, ...skills] };
  }
  return null;
}

function applyInsert(draft: string, insert: string) {
  if (mentionQuery(draft) !== null) return draft.replace(/@([a-z0-9 -]*)$/i, insert);
  return draft.replace(/(?:^|\s)\/([a-z0-9 -]*)$/i, (match) => `${match.startsWith(" ") ? " " : ""}${insert}`);
}

export function useComposerMenu(draft: string, onDraft: (next: string) => void, people: string[] = [], onInvite?: () => void) {
  const live = useMemo(() => menuFor(draft, people), [draft, people]);
  const [active, setActive] = useState(0);
  const [muted, setMuted] = useState(false);
  const menu = muted ? null : live;

  useEffect(() => {
    setActive(0);
  }, [draft]);

  useEffect(() => {
    if (!live) setMuted(false);
  }, [live]);

  function pick(row: MenuRow) {
    setMuted(true);
    if (row.id === "invite") {
      onInvite?.();
      return;
    }
    if (!row.insert) return;
    onDraft(applyInsert(draft, row.insert));
  }

  function onKeyDown(event: KeyboardEvent) {
    if (!menu?.rows.length) return false;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, menu.rows.length - 1));
      return true;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
      return true;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      onDraft(draft.replace(/@([a-z0-9 -]*)$/i, "").replace(/(?:^|\s)\/([a-z0-9 -]*)$/i, ""));
      return true;
    }
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      pick(menu.rows[Math.min(active, menu.rows.length - 1)]!);
      return true;
    }
    return false;
  }

  return { menu, active, setActive, pick, onKeyDown };
}

export function ComposerMenu({
  menu,
  active,
  onActive,
  onPick,
}: {
  menu: { label: string; rows: MenuRow[] } | null;
  active: number;
  onActive: (index: number) => void;
  onPick: (row: MenuRow) => void;
}) {
  if (!menu) return null;
  return (
    <div className="mention-pop slim-scroll" role="listbox" aria-label={menu.label}>
      <p className="menu-label">{menu.label === "Mention" ? "@  Agents and people" : "/  Tools and skills"}</p>
      {menu.rows.length === 0 && <p className="menu-empty">Nothing matches. Keep typing, or press Esc.</p>}
      {menu.rows.map((row, index) => (
        <button
          key={row.id}
          type="button"
          role="option"
          aria-selected={index === active}
          className={index === active ? "on" : ""}
          onMouseEnter={() => onActive(index)}
          onClick={() => onPick(row)}
        >
          <em>{row.kicker}</em>
          <strong>{row.title}</strong>
          <span>{row.detail}</span>
        </button>
      ))}
    </div>
  );
}
