"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LearnAuthShell } from "@/components/learn/shell";
import { DAILY_GOALS, LANGUAGES, LEVELS, ONBOARDING_REASONS, TOPICS } from "@/lib/learn-data";
import { saveProfile } from "@/lib/learn-store";
import type { LearnLevel } from "@/lib/learn-store";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [reason, setReason] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [lang, setLang] = useState("English");
  const [level, setLevel] = useState<LearnLevel>("Intermediate");
  const [dailyMinutes, setDailyMinutes] = useState(15);

  function toggleTopic(id: string) {
    setTopics((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));
  }

  function finish() {
    saveProfile({ reason, topics, uiLanguage: lang, level, dailyMinutes });
    router.push("/learn/plan");
  }

  const canNext =
    (step === 0 && reason) ||
    (step === 1 && topics.length > 0) ||
    (step === 2 && lang) ||
    (step === 3 && level) ||
    step === 4;

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
        {step === 3 && (
          <>
            <h2>Your English level</h2>
            <p>We will match content difficulty to you.</p>
            <div style={{ display: "grid", gap: 8, maxWidth: 360, margin: "0 auto" }}>
              {LEVELS.map((l) => (
                <button
                  key={l}
                  type="button"
                  className={level === l ? "learn-btn primary full" : "learn-btn secondary full"}
                  onClick={() => setLevel(l)}
                >
                  {l}
                </button>
              ))}
            </div>
          </>
        )}
        {step === 4 && (
          <>
            <h2>Daily learning goal</h2>
            <p>How many minutes can you practice each day?</p>
            <div style={{ display: "grid", gap: 8, maxWidth: 320, margin: "0 auto" }}>
              {DAILY_GOALS.map((m) => (
                <button
                  key={m}
                  type="button"
                  className={dailyMinutes === m ? "learn-btn primary full" : "learn-btn secondary full"}
                  onClick={() => setDailyMinutes(m)}
                >
                  {m} minutes / day
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
          {step < 4 ? (
            <button type="button" className="learn-btn primary" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
              Next
            </button>
          ) : (
            <button type="button" className="learn-btn primary" onClick={finish}>
              Start learning
            </button>
          )}
        </div>

        <div className="learn-step-dots" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className={step === i ? "on" : ""} />
          ))}
        </div>
      </div>
    </LearnAuthShell>
  );
}
