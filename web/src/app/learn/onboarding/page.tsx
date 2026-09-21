"use client";

import Link from "next/link";
import { useState } from "react";
import { LANGUAGES, ONBOARDING_REASONS, TOPICS } from "@/lib/learn-data";
import { LearnAuthShell } from "@/components/learn/shell";

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [reason, setReason] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [lang, setLang] = useState("English");

  function toggleTopic(id: string) {
    setTopics((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));
  }

  return (
    <LearnAuthShell>
      <div className="learn-onboard-step">
        {step === 0 && (
          <>
            <p style={{ fontSize: 13, color: "var(--learn-muted)", marginBottom: 8 }}>Just 5 questions before you start</p>
            <h2>Why do you want to learn English?</h2>
            <p>We will tune your plan and recommendations.</p>
            <div style={{ display: "grid", gap: 10, maxWidth: 360, margin: "0 auto" }}>
              {ONBOARDING_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={reason === r ? "learn-btn primary full" : "learn-btn secondary full"}
                  onClick={() => setReason(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <h2>Choose your favourite topics</h2>
            <p>Tap a few — we will fill your library and chat prompts.</p>
            <div className="learn-topic-cloud">
              {TOPICS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`learn-pill ${t.size ?? "md"} ${topics.includes(t.id) ? "on" : ""}`}
                  onClick={() => toggleTopic(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <h2>Application language</h2>
            <p>Interface and explanations will use this language.</p>
            <div style={{ display: "grid", gap: 8, maxWidth: 320, margin: "0 auto" }}>
              {LANGUAGES.map((l) => (
                <button
                  key={l}
                  type="button"
                  className={lang === l ? "learn-btn primary full" : "learn-btn secondary full"}
                  onClick={() => setLang(l)}
                >
                  {l}
                </button>
              ))}
            </div>
          </>
        )}

        <div style={{ marginTop: 28, display: "flex", gap: 10, justifyContent: "center" }}>
          {step > 0 && (
            <button type="button" className="learn-btn ghost" onClick={() => setStep((s) => s - 1)}>
              Back
            </button>
          )}
          {step < 2 ? (
            <button type="button" className="learn-btn primary" onClick={() => setStep((s) => s + 1)}>
              Next
            </button>
          ) : (
            <Link href="/learn/plan" className="learn-btn primary">
              Start learning
            </Link>
          )}
        </div>

        <div className="learn-step-dots" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span key={i} className={step === i ? "on" : ""} />
          ))}
        </div>
      </div>
    </LearnAuthShell>
  );
}
