import Link from "next/link";
import { LearnShell } from "@/components/learn/shell";
import { DAILY_TASKS } from "@/lib/learn-data";

const DAYS = [
  { label: "Mon", day: 15, today: false, done: true },
  { label: "Tue", day: 16, today: false, done: true },
  { label: "Wed", day: 17, today: false, done: true },
  { label: "Thu", day: 18, today: true, done: false },
  { label: "Fri", day: 19, today: false, done: false },
  { label: "Sat", day: 20, today: false, done: false },
  { label: "Sun", day: 21, today: false, done: false },
];

export default function PlanPage() {
  const done = DAILY_TASKS.filter((t) => t.done).length;
  const pct = Math.round((done / DAILY_TASKS.length) * 100);

  return (
    <LearnShell title="Personal plan" subtitle="Thursday, 18 September · Today 30% complete" action={<Link href="/learn/stats" className="learn-btn secondary sm">Statistics</Link>}>
      <div className="learn-grid-2">
        <div className="learn-card soft">
          <h2>This week</h2>
          <div className="learn-calendar-strip" style={{ marginTop: 16 }}>
            {DAYS.map((d) => (
              <div key={d.day} className={`learn-day ${d.today ? "today" : ""} ${d.done ? "done" : ""}`}>
                {d.label}
                <strong>{d.day}</strong>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
              <span>Today</span>
              <strong>{pct}%</strong>
            </div>
            <div className="learn-progress">
              <span style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        <div className="learn-card">
          <h3>Today&apos;s tasks</h3>
          <p>Complete your daily mix to keep the streak.</p>
          <div style={{ marginTop: 16 }}>
            {DAILY_TASKS.map((task) => (
              <div key={task.id} className="learn-task-row">
                <div className={`learn-check ${task.done ? "done" : ""}`}>{task.done ? "✓" : ""}</div>
                <div style={{ flex: 1 }}>
                  <strong>{task.label}</strong>
                  <div style={{ fontSize: 12, color: "var(--learn-muted)" }}>{task.minutes} min</div>
                </div>
                <Link href={task.id === "chat" ? "/learn/chat" : task.id === "read" ? "/learn/read/modernism" : "/learn/training/word"} className="learn-btn sm secondary">
                  {task.done ? "Review" : "Start"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="learn-grid-3" style={{ marginTop: 20 }}>
        <Link href="/learn/library" className="learn-card" style={{ display: "block" }}>
          <h3>Library</h3>
          <p>Books, podcasts, and video — filtered to your topics.</p>
        </Link>
        <Link href="/learn/exams" className="learn-card" style={{ display: "block" }}>
          <h3>Exams</h3>
          <p>Vocabulary tests and IELTS mocks with clear levels.</p>
        </Link>
        <Link href="/learn/mcp" className="learn-card" style={{ display: "block" }}>
          <h3>MCP studio</h3>
          <p>15+ niche MCP presets — export mcp.json for Cursor plugins.</p>
        </Link>
        <Link href="/learn/skills" className="learn-card" style={{ display: "block" }}>
          <h3>Skills hub</h3>
          <p>10,000+ GitHub skills searchable — install niche agent packs.</p>
        </Link>
      </div>
    </LearnShell>
  );
}
