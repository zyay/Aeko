"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LearnShell } from "@/components/learn/shell";
import { useLearnProfile } from "@/hooks/use-learn-profile";
import { taskHref } from "@/lib/learn-data";

function weekDays() {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const today = d.toDateString() === now.toDateString();
    return { label: labels[i], day: d.getDate(), today, done: today ? false : i < ((day + 6) % 7) };
  });
}

export default function PlanPage() {
  const router = useRouter();
  const { ready, hasProfile, tasks, progress, profile } = useLearnProfile();
  const days = weekDays();
  const dateLabel = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  useEffect(() => {
    if (ready && !hasProfile) router.replace("/learn/onboarding");
  }, [ready, hasProfile, router]);

  if (!ready || !hasProfile) return null;

  return (
    <LearnShell
      title="Personal plan"
      subtitle={`${dateLabel} · Today ${progress}% complete · ${profile?.level ?? "Intermediate"}`}
      action={
        <Link href="/learn/stats" className="learn-btn secondary sm">
          Statistics
        </Link>
      }
    >
      <div className="learn-grid-2">
        <div className="learn-card soft">
          <h2>This week</h2>
          <div className="learn-calendar-strip" style={{ marginTop: 16 }}>
            {days.map((d) => (
              <div key={d.day} className={`learn-day ${d.today ? "today" : ""} ${d.done ? "done" : ""}`}>
                {d.label}
                <strong>{d.day}</strong>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
              <span>Today</span>
              <strong>{progress}%</strong>
            </div>
            <div className="learn-progress">
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        <div className="learn-card">
          <h3>Today&apos;s tasks</h3>
          <p>Complete your daily mix to keep the streak. Goal: {profile?.dailyMinutes ?? 15} min.</p>
          <div style={{ marginTop: 16 }}>
            {tasks.map((task) => (
              <div key={task.id} className={`learn-task-row ${task.done ? "task-done" : ""}`}>
                <div className={`learn-check ${task.done ? "done" : ""}`}>{task.done ? "✓" : ""}</div>
                <div style={{ flex: 1 }}>
                  <strong>{task.label}</strong>
                  <div style={{ fontSize: 12, color: "var(--learn-muted)" }}>{task.minutes} min</div>
                </div>
                <Link href={taskHref(task.id)} className="learn-btn sm secondary">
                  {task.done ? "Review" : "Start"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="learn-grid-3" style={{ marginTop: 20 }}>
        <Link href="/learn/library" className="learn-card learn-card-hover" style={{ display: "block" }}>
          <h3>Library</h3>
          <p>Books, podcasts, and video — filtered to your topics.</p>
        </Link>
        <Link href="/learn/exams" className="learn-card learn-card-hover" style={{ display: "block" }}>
          <h3>Exams</h3>
          <p>Vocabulary tests and IELTS mocks with clear levels.</p>
        </Link>
        <Link href="/learn/settings" className="learn-card learn-card-hover" style={{ display: "block" }}>
          <h3>Tutor settings</h3>
          <p>Connect your model for GPT chat practice.</p>
        </Link>
        <Link href="/learn/mcp" className="learn-card learn-card-hover" style={{ display: "block" }}>
          <h3>MCP studio</h3>
          <p>15+ niche MCP presets — export mcp.json for Cursor plugins.</p>
        </Link>
        <Link href="/learn/skills" className="learn-card learn-card-hover" style={{ display: "block" }}>
          <h3>Skills hub</h3>
          <p>10,000+ GitHub skills searchable — install niche agent packs.</p>
        </Link>
      </div>
    </LearnShell>
  );
}
