"use client";

import { useEffect, useState } from "react";
import { AGENT_ROSTER, setRoomAgentId } from "@/lib/agents";
import { loadVault, saveVault } from "@/lib/vault-store";

type Note = { time: string; text: string };
type Patch = { id: string; title: string; status: "open" | "review" | "merged" };
type Audit = { id: string; actor: string; action: string; createdAt: number };

export function ChannelExtras({ roomId }: { roomId: string }) {
  const [tab, setTab] = useState<"canvas" | "media" | "project" | "audit">("canvas");
  const [canvas, setCanvas] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [time, setTime] = useState("00:12");
  const [note, setNote] = useState("");
  const [patches, setPatches] = useState<Patch[]>([]);
  const [patchTitle, setPatchTitle] = useState("");
  const [audit, setAudit] = useState<Audit[]>([]);

  useEffect(() => {
    void loadVault(roomId).then((v) => setCanvas(v?.text ?? ""));
    setNotes(read<Note>(`aeko-media:${roomId}`));
    setPatches(read<Patch>(`aeko-patches:${roomId}`));
    void fetch(`/api/rooms/${roomId}/audit`)
      .then((r) => r.json())
      .then((j: { audit?: Audit[] }) => setAudit(j.audit ?? []))
      .catch(() => setAudit([]));
  }, [roomId]);

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
            void saveVault(roomId, "canvas", canvas);
          }}
        >
          <textarea value={canvas} onChange={(e) => setCanvas(e.target.value)} rows={6} aria-label="Canvas" placeholder="Shared notes for this channel" />
          <button type="submit" className="head-chip">Save canvas</button>
        </form>
      )}
      {tab === "media" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const next = [{ time, text: note }, ...notes];
            setNotes(next);
            write(`aeko-media:${roomId}`, next);
            setNote("");
          }}
        >
          <input value={time} onChange={(e) => setTime(e.target.value)} aria-label="Timestamp" />
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Comment at this time" aria-label="Media note" />
          <button type="submit" className="head-chip">Add note</button>
          {notes.map((n, i) => (
            <p key={i}>{n.time} · {n.text}</p>
          ))}
        </form>
      )}
      {tab === "project" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const next = [{ id: String(Date.now()), title: patchTitle, status: "open" as const }, ...patches];
            setPatches(next);
            write(`aeko-patches:${roomId}`, next);
            setPatchTitle("");
          }}
        >
          <input value={patchTitle} onChange={(e) => setPatchTitle(e.target.value)} placeholder="Patch title" aria-label="Patch title" />
          <button type="submit" className="head-chip">Add patch</button>
          {patches.map((p) => (
            <p key={p.id}>
              {p.title} · {p.status}
              <button
                type="button"
                onClick={() => {
                  const next: Patch[] = patches.map((x) =>
                    x.id === p.id
                      ? { ...x, status: x.status === "open" ? "review" : x.status === "review" ? "merged" : "open" }
                      : x,
                  );
                  setPatches(next);
                  write(`aeko-patches:${roomId}`, next);
                }}
              >
                Advance
              </button>
            </p>
          ))}
        </form>
      )}
      <div className="work-tabs">
        {AGENT_ROSTER.map((a) => (
          <button key={a.id} type="button" className="head-chip" onClick={() => setRoomAgentId(roomId, a.id)}>
            Add {a.name}
          </button>
        ))}
      </div>
      {tab === "audit" && (
        <div>
          {audit.length === 0 && <p>No audit events yet.</p>}
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

function read<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]") as T[];
  } catch {
    return [];
  }
}

function write(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}
