"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const TOUR_KEY = "aeko-tour-v3";

const STEPS = [
  {
    anchor: "composer",
    where: "Top of the desk",
    title: "Write to a person",
    body: "A normal note goes to the people in the room. Type @ and pick a bot. The choice fills the field and the list closes.",
  },
  {
    anchor: "agent-field",
    where: "Under the composer",
    title: "Agent field",
    body: "This is the agent field. Pick who should take a task. Then type @ and their name in the composer.",
  },
  {
    anchor: "fast-search",
    where: "Under the agent field",
    title: "Fast search",
    body: "Press Ctrl+K. Fast search opens commands, rooms, and bots. It stays off the rail.",
  },
  {
    anchor: "rooms",
    where: "Under the composer",
    title: "Open a room",
    body: "Click a card. Inside, notes stay encrypted on this device. @Name runs that bot in a private thread.",
  },
  {
    anchor: "rail",
    where: "Left edge",
    title: "The rail",
    body: "Plus starts a channel. Home, Stream, Agents, Skills, and Workflows sit under it. The gear is model settings.",
  },
  {
    anchor: "agents",
    where: "Left edge",
    title: "Agents",
    body: "Open Agents to meet a bot, start a chat, recolor the face, and connect an app. The face is yours. The old mark is gone.",
  },
  {
    anchor: "guide",
    where: "Under the rooms",
    title: "How a room works",
    body: "Invite a person only after a room exists. They sign in once. You send a wrapped key. Your API key never leaves this browser.",
  },
  {
    anchor: "share",
    where: "Top right",
    title: "Share the room",
    body: "Share invites someone into the open room. On entry you choose whether they may call your bots and tools.",
  },
  {
    anchor: "settings",
    where: "Left edge",
    title: "The model key",
    body: "Settings checks the key and lists models. The key and the model name stay on this device.",
  },
];

export function WorkspaceTour({ active }: { active: boolean }) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState<number | null>(null);
  const [box, setBox] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  useEffect(() => {
    if (!active) return;
    if (window.localStorage.getItem(TOUR_KEY) === "done") return;
    const timer = window.setTimeout(() => setStep(0), 500);
    return () => window.clearTimeout(timer);
  }, [active]);

  useEffect(() => {
    if (step === null) return;
    const anchor = STEPS[step]?.anchor;
    function measure() {
      const node = anchor ? document.querySelector(`[data-tour="${anchor}"]`) : null;
      if (!node) {
        setBox(null);
        return;
      }
      const rect = node.getBoundingClientRect();
      setBox({ top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12 });
    }
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [step]);

  function close() {
    window.localStorage.setItem(TOUR_KEY, "done");
    setStep(null);
  }

  const current = step === null ? null : STEPS[step];
  const cardTop = box ? Math.min(box.top + box.height + 14, window.innerHeight - 240) : 80;
  const cardLeft = box ? Math.min(Math.max(24, box.left), window.innerWidth - 400) : 24;

  return (
    <AnimatePresence>
      {current && step !== null && (
        <motion.div className="tour-layer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {box && (
            <motion.div
              className="tour-hole"
              initial={false}
              animate={{ top: box.top, left: box.left, width: box.width, height: box.height }}
              transition={{ duration: reduce ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
            />
          )}
          <motion.div
            key={step}
            className="tour-card"
            role="dialog"
            aria-label="Workspace tour"
            style={{ top: cardTop, left: cardLeft }}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: 6 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="desk-kicker">{current.where} · {step + 1} / {STEPS.length}</p>
            <h2>{current.title}</h2>
            <p>{current.body}</p>
            <div className="tour-actions">
              <button type="button" className="setup-back" onClick={close}>Skip</button>
              {step < STEPS.length - 1 ? (
                <button type="button" className="solid slim" onClick={() => setStep(step + 1)}>Next</button>
              ) : (
                <button type="button" className="solid slim" onClick={close}>Start</button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
