"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { LearnShell } from "@/components/learn/shell";
import { getExam } from "@/lib/learn-data";
import { saveExamScore } from "@/lib/learn-store";

export default function ExamRunPage() {
  const router = useRouter();
  const params = useParams();
  const exam = getExam(String(params.id ?? ""));
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (done) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [done]);

  if (!exam) {
    return (
      <LearnShell title="Not found" subtitle="Exam unavailable">
        <Link href="/learn/exams" className="learn-btn primary">
          Back
        </Link>
      </LearnShell>
    );
  }

  const q = exam.questions[idx];

  function choose(option: number) {
    if (!exam || picked != null || done) return;
    setPicked(option);
    const nextScore = option === q.answer ? score + 1 : score;
    setScore(nextScore);
    setTimeout(() => {
      if (idx + 1 >= exam.questions.length) {
        saveExamScore({ examId: exam.id, score: nextScore, total: exam.questions.length, completedAt: Date.now() });
        setDone(true);
      } else {
        setIdx((i) => i + 1);
        setPicked(null);
      }
    }, 600);
  }

  if (done) {
    const pct = Math.round((score / exam.questions.length) * 100);
    return (
      <LearnShell title="Results" subtitle={`${exam.title} · ${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`}>
        <div className="learn-card soft" style={{ maxWidth: 480, textAlign: "center", margin: "0 auto" }}>
          <h2 style={{ fontSize: 48, margin: "0 0 8px" }}>{pct}%</h2>
          <p>
            {score} / {exam.questions.length} correct
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 24 }}>
            <Link href="/learn/exams" className="learn-btn secondary">
              All exams
            </Link>
            <Link href="/learn/plan" className="learn-btn primary">
              Back to plan
            </Link>
          </div>
        </div>
      </LearnShell>
    );
  }

  return (
    <LearnShell title={exam.title} subtitle={`Question ${idx + 1} of ${exam.questions.length} · ${exam.level}`}>
      <div className="learn-card" style={{ maxWidth: 640, margin: "0 auto" }}>
        <p style={{ fontSize: 18, lineHeight: 1.5 }}>{q.prompt}</p>
        <div style={{ display: "grid", gap: 10, marginTop: 24 }}>
          {q.options.map((opt, i) => (
            <button
              key={opt}
              type="button"
              className={`learn-btn full secondary ${picked === i ? (i === q.answer ? "learn-correct" : "learn-wrong") : ""}`}
              onClick={() => choose(i)}
              disabled={picked != null}
            >
              {opt}
            </button>
          ))}
        </div>
        <button type="button" className="learn-btn ghost" style={{ marginTop: 20 }} onClick={() => router.push("/learn/exams")}>
          Exit
        </button>
      </div>
    </LearnShell>
  );
}
