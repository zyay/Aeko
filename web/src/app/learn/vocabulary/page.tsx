"use client";

import { FormEvent, useEffect, useState } from "react";
import { LearnShell } from "@/components/learn/shell";
import { addWord, listVocabulary, removeWord, type VocabWord } from "@/lib/learn-store";

export default function VocabularyPage() {
  const [words, setWords] = useState<VocabWord[]>([]);
  const [word, setWord] = useState("");
  const [translation, setTranslation] = useState("");
  const [phonetic, setPhonetic] = useState("");
  const [example, setExample] = useState("");

  useEffect(() => {
    setWords(listVocabulary());
    const onChange = () => setWords(listVocabulary());
    window.addEventListener("abc-learn-change", onChange);
    return () => window.removeEventListener("abc-learn-change", onChange);
  }, []);

  function save(e: FormEvent) {
    e.preventDefault();
    if (!word.trim() || !translation.trim()) return;
    addWord({
      word: word.trim(),
      phonetic: phonetic.trim() || undefined,
      definition: translation.trim(),
      example: example.trim() || undefined,
    });
    setWord("");
    setTranslation("");
    setPhonetic("");
    setExample("");
  }

  return (
    <LearnShell title="Vocabulary" subtitle={`${words.length} words saved`}>
      <div className="learn-grid-2">
        <form className="learn-card" onSubmit={save}>
          <h3 style={{ marginTop: 0 }}>New word</h3>
          <div className="learn-field">
            <label htmlFor="word">Word</label>
            <input id="word" className="learn-input" value={word} onChange={(e) => setWord(e.target.value)} placeholder="e.g. sustainable" />
          </div>
          <div className="learn-field">
            <label htmlFor="translation">Translation / definition</label>
            <input id="translation" className="learn-input" value={translation} onChange={(e) => setTranslation(e.target.value)} placeholder="Your language" />
          </div>
          <div className="learn-field">
            <label htmlFor="transcription">Transcription</label>
            <input id="transcription" className="learn-input" value={phonetic} onChange={(e) => setPhonetic(e.target.value)} placeholder="/səˈsteɪnəbl/" />
          </div>
          <div className="learn-field">
            <label htmlFor="example">Example sentence</label>
            <textarea id="example" className="learn-input" rows={3} value={example} onChange={(e) => setExample(e.target.value)} placeholder="Use the word in context…" />
          </div>
          <button type="submit" className="learn-btn primary">
            Save word
          </button>
        </form>
        <div className="learn-card soft">
          <h3>Your words</h3>
          {words.length === 0 ? (
            <p className="learn-empty">No words yet — read an article and tap highlighted words to add them.</p>
          ) : (
            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
              {words.map((w) => (
                <div key={w.id} className="learn-content-row">
                  <div className="learn-content-copy">
                    <strong>{w.word}</strong>
                    <span>{w.definition}</span>
                    {w.example && <span style={{ fontSize: 12 }}>&ldquo;{w.example}&rdquo;</span>}
                  </div>
                  <button type="button" className="learn-btn ghost sm" onClick={() => removeWord(w.id)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </LearnShell>
  );
}
