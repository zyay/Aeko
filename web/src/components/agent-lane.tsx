"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { AgentTurn, AgentPrefs, ShareMode } from "@/lib/room-policy";
import type { AgentDef } from "@/lib/agents";
import { parseDecision, shareDecision } from "@/lib/jev";
import { CHAT_SEATS, getBoard, getSeatProviders, setBoard, setSeatProviders, type ChatSeat, type ModelBoard } from "@/lib/model-board";
import { listBooked, type BookedProvider } from "@/lib/provider-book";
import { modelThinks } from "@/lib/model-think";

export function ShareGate({
  open,
  saved,
  onChoose,
}: {
  open: boolean;
  saved: ShareMode | null;
  onChoose: (mode: ShareMode) => void;
}) {
  if (!open) return null;
  return (
    <div className="share-gate" role="dialog" aria-labelledby="share-title">
      <div className="share-card">
        <p className="desk-kicker">This room</p>
        <h2 id="share-title">Share tools with people here?</h2>
        <p>
          Your API key and model stay on this device. If you share, people in this room can call your bots, tools, and skills. If you keep them private, their @mentions do nothing.
        </p>
        <div className="meet-nav">
          <button type="button" className={saved === "private" ? "solid slim" : "setup-back"} onClick={() => onChoose("private")}>
            Keep private
          </button>
          <button type="button" className={saved === "shared" ? "solid slim" : "setup-back"} onClick={() => onChoose("shared")}>
            Share tools
          </button>
        </div>
      </div>
    </div>
  );
}

export function AgentLane({
  open,
  agent,
  note,
  turns,
  prefs,
  steer,
  busy,
  onClose,
  onSteer,
  onDraft,
  onPrefs,
  onShareResult,
}: {
  open: boolean;
  agent: AgentDef;
  note: string;
  turns: AgentTurn[];
  prefs: AgentPrefs;
  steer: string;
  busy: boolean;
  onClose: () => void;
  onSteer: (text: string) => void;
  onDraft: (text: string) => void;
  onPrefs: (prefs: AgentPrefs) => void;
  onShareResult: (text: string) => void;
}) {
  const [board, setBoardState] = useState<ModelBoard>({ fast: "", reason: "", code: "", write: "" });
  const [seatProv, setSeatProv] = useState<Record<ChatSeat, string>>({ fast: "", reason: "", code: "", write: "" });
  const [books, setBooks] = useState<BookedProvider[]>([]);
  useEffect(() => {
    if (!open) return;
    setBoardState(getBoard(agent.id));
    setSeatProv(getSeatProviders(agent.id));
    void listBooked().then(setBooks);
  }, [open, agent.id]);
  if (!open) return null;
  const lastAnswer = [...turns].reverse().find((turn) => turn.role === "agent" && turn.text.trim());
  return (
    <aside className="agent-lane">
      <header>
        <div>
          <p className="desk-kicker">Private thread</p>
          <strong>{agent.name}</strong>
        </div>
        <button type="button" className="setup-back" onClick={onClose}>Close</button>
      </header>
      {note && <p className="agent-note">{note}</p>}
      <div className="lane-prefs">
        {agent.kind === "decision" ? null : (
          <div className="seat-board">
            <p className="tiny">Seats for this bot. Pick a model and, if you added extra keys, which provider. Empty uses Settings. When two seats differ, Jev picks the seat.</p>
            {CHAT_SEATS.map((seat) => (
              <label key={seat.id}>
                {seat.label}
                <input
                  value={board[seat.id]}
                  placeholder={seat.placeholder}
                  spellCheck={false}
                  onChange={(e) => {
                    const next = { ...board, [seat.id]: e.target.value };
                    setBoardState(next);
                    setBoard(agent.id, next);
                  }}
                />
                <select
                  aria-label={`${seat.label} provider`}
                  value={seatProv[seat.id]}
                  onChange={(e) => {
                    const next = { ...seatProv, [seat.id]: e.target.value };
                    setSeatProv(next);
                    setSeatProviders(agent.id, next);
                  }}
                >
                  <option value="">Settings model</option>
                  {books.map((row) => (
                    <option key={row.id} value={row.id}>{row.label}</option>
                  ))}
                </select>
                {modelThinks(board[seat.id]) && <span className="tiny">Thinking model</span>}
              </label>
            ))}
          </div>
        )}
        <label className="lane-check">
          <input type="checkbox" checked={prefs.context} onChange={(e) => onPrefs({ ...prefs, context: e.target.checked })} />
          Use room context
        </label>
        {agent.kind === "decision" ? (
          <p className="tiny">Jev scores the situation. It does not write a reply. Add a line like ? choice Which team? | Design | Support to ask your own question. The key stays on this device.</p>
        ) : (
          <>
            <div className="meet-nav">
              <button type="button" className={!prefs.fast && !prefs.thinking ? "head-chip on" : "head-chip"} onClick={() => onPrefs({ ...prefs, fast: false, thinking: false })}>Standard</button>
              <button type="button" className={prefs.fast ? "head-chip on" : "head-chip"} onClick={() => onPrefs({ ...prefs, fast: true, thinking: false })}>Fast</button>
              <button type="button" className={prefs.thinking ? "head-chip on" : "head-chip"} onClick={() => onPrefs({ ...prefs, fast: false, thinking: true })}>Thinking</button>
            </div>
            <p className="tiny">The model name and key never go into the room. Fast answers in fewer steps. Thinking stays in this thread{agent.thinking ? " and this bot prefers it" : ""}.</p>
          </>
        )}
      </div>
      <div className="lane-log">
        {turns.length === 0 && <p className="tiny">{agent.kind === "decision" ? "Type @Jev and the situation. The scores stay in this thread." : "Type @Name in the room. The person sees your normal notes. This thread is where the bot works."}</p>}
        {turns.map((turn) => {
          const decision = turn.role === "agent" ? parseDecision(turn.text) : null;
          if (!decision) return <p key={turn.id} className={`lane-${turn.role}`}>{turn.text}</p>;
          return (
            <div key={turn.id} className="decision-list">
              {decision.map((block) => (
                <article key={block.title} className="decision-card">
                  <strong>{block.title}</strong>
                  <em>{block.verdict}</em>
                  <div className="decision-bar" aria-hidden="true"><span style={{ width: `${block.percent}%` }} /></div>
                  {block.parts.length > 0 && (
                    <div className="decision-pills">
                      {block.parts.map((part) => (
                        <span key={part.label}>{part.label} {part.percent}%</span>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          );
        })}
      </div>
      {lastAnswer && (
        <button type="button" className="setup-back" onClick={() => onShareResult(shareDecision(lastAnswer.text))}>
          Send the last answer to the room
        </button>
      )}
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          const text = steer.trim();
          if (!text || busy) return;
          onSteer(text);
          onDraft("");
        }}
      >
        <input value={steer} onChange={(e) => onDraft(e.target.value)} placeholder={agent.kind === "decision" ? "Situation for Jev" : `Steer ${agent.name}`} aria-label={agent.kind === "decision" ? "Situation for Jev" : "Steer the agent"} />
        <button type="submit" className="solid slim" disabled={!steer.trim() || busy}>Send</button>
      </form>
    </aside>
  );
}
