"use client";

import { useEffect, useMemo, useState } from "react";
import { IconSearch } from "@/components/ui-primitives";

export type PaletteAction = {
  id: string;
  label: string;
  hint?: string;
  run: () => void;
};

export function CommandPalette({
  open,
  onClose,
  actions,
}: {
  open: boolean;
  onClose: () => void;
  actions: PaletteAction[];
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActive(0);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions.slice(0, 12);
    return actions.filter((a) => a.label.toLowerCase().includes(q) || a.hint?.toLowerCase().includes(q)).slice(0, 12);
  }, [actions, query]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  if (!open) return null;

  return (
    <div className="palette-bg" onClick={onClose} role="presentation">
      <div className="palette" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Command palette">
        <div className="palette-search">
          <IconSearch size={18} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands and tasks…"
            aria-label="Command search"
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(i + 1, filtered.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              }
              if (e.key === "Enter" && filtered[active]) {
                filtered[active].run();
                onClose();
              }
            }}
          />
          <kbd>Esc</kbd>
        </div>
        <div className="palette-list">
          {filtered.length === 0 ? (
            <p className="palette-empty">No matches</p>
          ) : (
            filtered.map((action, idx) => (
              <button
                key={action.id}
                type="button"
                className={`palette-item${idx === active ? " on" : ""}`}
                onMouseEnter={() => setActive(idx)}
                onClick={() => {
                  action.run();
                  onClose();
                }}
              >
                <span>{action.label}</span>
                {action.hint ? <small>{action.hint}</small> : null}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
