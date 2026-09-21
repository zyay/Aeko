import Link from "next/link";
import { LearnShell } from "@/components/learn/shell";
import { TRAINING_WORD } from "@/lib/learn-data";

export default function TrainingPage() {
  return (
    <LearnShell title="Training" subtitle="Flashcard review">
      <div className="learn-flashcard learn-card soft">
        <p style={{ fontSize: 12, color: "var(--learn-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Word</p>
        <h2>{TRAINING_WORD.word}</h2>
        <p className="phonetic">{TRAINING_WORD.phonetic}</p>
        <p>{TRAINING_WORD.definition}</p>
        <div className="illus">Illustration</div>
        <p style={{ fontSize: 14, color: "var(--learn-muted)" }}>&ldquo;{TRAINING_WORD.example}&rdquo;</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 28 }}>
          <button type="button" className="learn-btn secondary">
            Learn
          </button>
          <button type="button" className="learn-btn primary">
            Know
          </button>
        </div>
        <Link href="/learn/plan" className="learn-btn ghost" style={{ marginTop: 16 }}>
          Back to plan
        </Link>
      </div>
    </LearnShell>
  );
}
