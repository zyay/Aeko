"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LearnShell } from "@/components/learn/shell";
import { TRAINING_WORD } from "@/lib/learn-data";
import { completeTask, dueVocabulary, listVocabulary, reviewWord, type VocabWord } from "@/lib/learn-store";

export default function TrainingPage() {
  const [card, setCard] = useState<VocabWord | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    const due = dueVocabulary();
    setCard(due[0] ?? listVocabulary()[0] ?? null);
  }, []);

  function refresh() {
    const due = dueVocabulary();
    setCard(due[0] ?? null);
    setShowAnswer(false);
  }

  function answer(known: boolean) {
    if (!card) return;
    reviewWord(card.id, known);
    if (known) completeTask("vocab", 12);
    refresh();
  }

  const display = card ?? {
    word: TRAINING_WORD.word,
    phonetic: TRAINING_WORD.phonetic,
    definition: TRAINING_WORD.definition,
    example: TRAINING_WORD.example,
    id: "demo",
  };

  return (
    <LearnShell title="Training" subtitle={card ? "Flashcard review" : "Add words to start reviewing"}>
      <div className="learn-flashcard learn-card soft">
        <p style={{ fontSize: 12, color: "var(--learn-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Word</p>
        <h2>{display.word}</h2>
        {display.phonetic && <p className="phonetic">{display.phonetic}</p>}
        {showAnswer ? (
          <>
            <p>{display.definition}</p>
            {display.example && <p style={{ fontSize: 14, color: "var(--learn-muted)" }}>&ldquo;{display.example}&rdquo;</p>}
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 28 }}>
              <button type="button" className="learn-btn secondary" onClick={() => answer(false)}>
                Learn
              </button>
              <button type="button" className="learn-btn primary" onClick={() => answer(true)}>
                Know
              </button>
            </div>
          </>
        ) : (
          <button type="button" className="learn-btn primary" style={{ marginTop: 24 }} onClick={() => setShowAnswer(true)}>
            Show answer
          </button>
        )}
        <Link href="/learn/plan" className="learn-btn ghost" style={{ marginTop: 16 }}>
          Back to plan
        </Link>
      </div>
    </LearnShell>
  );
}
