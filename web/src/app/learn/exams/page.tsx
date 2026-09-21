import Link from "next/link";
import { LearnShell } from "@/components/learn/shell";
import { EXAMS } from "@/lib/learn-data";

export default function ExamsPage() {
  return (
    <LearnShell title="Exams" subtitle="Vocabulary tests and IELTS preparation">
      <div className="learn-grid-3">
        {EXAMS.map((exam) => (
          <div key={exam.id} className="learn-card learn-card-hover">
            <span className="learn-pill sm" style={{ marginBottom: 12 }}>
              {exam.level}
            </span>
            <h3>{exam.title}</h3>
            <p>{exam.questions.length} questions · timed</p>
            <Link href={`/learn/exams/${exam.id}`} className="learn-btn primary" style={{ marginTop: 16, display: "inline-flex" }}>
              Start
            </Link>
          </div>
        ))}
      </div>
    </LearnShell>
  );
}
