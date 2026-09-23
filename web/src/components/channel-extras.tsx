"use client";

import { useEffect, useMemo, useState } from "react";
import { AGENT_ROSTER, setRoomAgentId } from "@/lib/agents";
import { EmptyState } from "@/components/ui-kit";
import type { Line } from "@/components/aeko-app-types";
import { encodeCanvas, encodeNote, encodePatch } from "@/lib/chat-history";
import { listInstalledSkills, roomSkillIds, toggleRoomSkill } from "@/lib/skill-context";

type Patch = { id: string; title: string; status: "open" | "review" | "merged" };
type Audit = { id: string; actor: string; action: string; createdAt: number };

function parseNote(text: string) {
  const [time, ...rest] = text.split("\n");
  return { time: time || "", text: rest.join("\n") };
}

function parsePatch(text: string): Patch | null {
  const [id, title, status] = text.split("\t");
  if (!id || !title) return null;
  const next = status === "review" || status === "merged" ? status : "open";
  return { id, title, status: next };
}

export function ChannelExtras({
  roomId,
  messages,
  onShare,
}: {
  roomId: string;
  messages: Line[];
  onShare: (plaintext: string) => void;
}) {
  const [tab, setTab] = useState<"canvas" | "media" | "project" | "audit">("canvas");
  const [draft, setDraft] = useState("");
  const [time, setTime] = useState("00:12");
  const [note, setNote] = useState("");
  const [patchTitle, setPatchTitle] = useState("");
  const [audit, setAudit] = useState<Audit[]>([]);
  const [skills, setSkills] = useState(listInstalledSkills);
  const [pinned, setPinned] = useState<string[]>([]);

  const canvas = useMemo(() => {
    const rows = messages.filter((m) => m.record === "canvas");
    return rows.length ? rows[rows.length - 1]!.text : "";
  }, [messages]);

  const notes = useMemo(() => messages.filter((m) => m.record === "note").map((m) => parseNote(m.text)), [messages]);

  const patches = useMemo(() => {
    const map = new Map<string, Patch>();
    for (const m of messages) {
      if (m.record !== "patch") continue;
      const patch = parsePatch(m.text);
      if (patch) map.set(patch.id, patch);
    }
    return [...map.values()];
  }, [messages]);

  useEffect(() => {
    setDraft(canvas);
  }, [canvas]);

  useEffect(() => {
    const refresh = () => {
      setSkills(listInstalledSkills());
      setPinned(roomSkillIds(roomId));
    };
    refresh();
    window.addEventListener("abc-skills-change", refresh);
    window.addEventListener("aeko-room-skills", refresh);
    return () => {
      window.removeEventListener("abc-skills-change", refresh);
      window.removeEventListener("aeko-room-skills", refresh);
    };
  }, [roomId]);

  useEffect(() => {
    void fetch(`/api/rooms/${roomId}/audit`)
      .then((r) => r.json())
      .then((j: { audit?: Audit[] }) => setAudit(j.audit ?? []))
      .catch(() => setAudit([]));
  }, [roomId, messages.length]);

  return (
    <section className="channel-extras">
      <div className="work-tabs">
        {(["canvas", "media", "project", "audit"] as const).map((id) => (
          <button key={id} type="button" className={tab === id ? "head-chip on" : "head-chip"} onClick={() => setTab(id)}>
            {id}
          </button>
        ))}
      </div>
      {tab === "canvas" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onShare(encodeCanvas(draft));
          }}
        >
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={6} aria-label="Canvas" placeholder="Shared notes for this channel" />
          <button type="submit" className="head-chip">
            Save canvas
          </button>
        </form>
      )}
      {tab === "media" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!note.trim()) return;
            onShare(encodeNote(time, note.trim()));
            setNote("");
          }}
        >
          <input value={time} onChange={(e) => setTime(e.target.value)} aria-label="Timestamp" />
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Comment at this time" aria-label="Media note" />
          <button type="submit" className="head-chip">
            Add note
          </button>
          {notes.map((n, i) => (
            <p key={`${n.time}-${i}`}>
              {n.time} · {n.text}
            </p>
          ))}
        </form>
      )}
      {tab === "project" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!patchTitle.trim()) return;
            onShare(encodePatch(crypto.randomUUID(), patchTitle.trim(), "open"));
            setPatchTitle("");
          }}
        >
          <input value={patchTitle} onChange={(e) => setPatchTitle(e.target.value)} placeholder="Patch title" aria-label="Patch title" />
          <button type="submit" className="head-chip">
            Add patch
          </button>
          {patches.map((p) => (
            <p key={p.id}>
              {p.title} · {p.status}
              <button
                type="button"
                onClick={() => {
                  const status = p.status === "open" ? "review" : p.status === "review" ? "merged" : "open";
                  onShare(encodePatch(p.id, p.title, status));
                }}
              >
                Advance
              </button>
            </p>
          ))}
        </form>
      )}
      <div>
        <p>Channel skills</p>
        {skills.length === 0 && <EmptyState compact title="No skills yet" body="Install one on the desk Skills tab, then pin it to this channel." />}
        {skills.slice(0, 8).map((s) => (
          <p key={s.id}>
            {s.name}
            <button type="button" onClick={() => setPinned(toggleRoomSkill(roomId, s.id))}>
              {pinned.includes(s.id) ? "Pinned" : "Pin"}
            </button>
          </p>
        ))}
      </div>
      <div className="work-tabs">
        {AGENT_ROSTER.map((a) => (
          <button key={a.id} type="button" className="head-chip" onClick={() => setRoomAgentId(roomId, a.id)}>
            Add {a.name}
          </button>
        ))}
      </div>
      {tab === "audit" && (
        <div>
          {audit.length === 0 && <EmptyState compact title="No audit yet" body="Sends, invites, and workflow runs will be listed here." />}
          {audit.map((a) => (
            <p key={a.id}>
              {a.actor} · {a.action} · {new Date(a.createdAt).toLocaleString()}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
