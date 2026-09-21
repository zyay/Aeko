"use client";

import { useMemo } from "react";
import { LearnShell } from "@/components/learn/shell";
import { computeStreak, getActivity, getCompletedItems, getTasks, loadProfile } from "@/lib/learn-store";

export default function StatsPage() {
  const activity = getActivity();
  const streak = computeStreak();
  const profile = loadProfile();
  const tasks = getTasks();
  const completed = getCompletedItems();

  const minutesThisWeek = useMemo(() => {
    const now = new Date();
    let total = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      total += activity[key] ?? 0;
    }
    return total;
  }, [activity]);

  const monthProgress = useMemo(() => {
    const goal = (profile?.dailyMinutes ?? 15) * 30;
    const monthTotal = Object.entries(activity)
      .filter(([k]) => k.startsWith(new Date().toISOString().slice(0, 7)))
      .reduce((s, [, v]) => s + v, 0);
    return goal ? Math.min(100, Math.round((monthTotal / goal) * 100)) : 0;
  }, [activity, profile]);

  const reading = tasks.find((t) => t.id === "read")?.done ? 84 : Math.min(completed.length * 20, 80);
  const listening = tasks.find((t) => t.id === "listen")?.done ? 67 : Math.min(completed.length * 15, 60);
  const writing = tasks.find((t) => t.id === "chat")?.done ? 52 : Math.min(completed.length * 10, 50);

  const days = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 28 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (27 - i));
      const key = d.toISOString().slice(0, 10);
      const mins = activity[key] ?? 0;
      return { day: d.getDate(), today: key === now.toISOString().slice(0, 10), done: mins >= 5, mins };
    });
  }, [activity]);

  return (
    <LearnShell title="Statistics" subtitle={`${streak} day streak · ${minutesThisWeek} min this week`}>
      <div className="learn-grid-2">
        <div className="learn-card soft">
          <h2>Monthly activity</h2>
          <p style={{ marginBottom: 16 }}>{monthProgress}% of monthly goal completed</p>
          <div className="learn-progress" style={{ height: 10 }}>
            <span style={{ width: `${monthProgress}%` }} />
          </div>
          <div className="learn-calendar-strip" style={{ marginTop: 24 }}>
            {days.map((d, i) => (
              <div key={i} className={`learn-day ${d.today ? "today" : ""} ${d.done ? "done" : ""}`} style={{ padding: 6 }} title={`${d.mins} min`}>
                <strong style={{ fontSize: 12 }}>{d.day}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="learn-card">
          <h3>Skills</h3>
          <div className="learn-stat-bar">
            <label>
              <span>Reading</span>
              <span>{reading}%</span>
            </label>
            <div className="learn-progress">
              <span style={{ width: `${reading}%` }} />
            </div>
          </div>
          <div className="learn-stat-bar">
            <label>
              <span>Writing</span>
              <span>{writing}%</span>
            </label>
            <div className="learn-progress">
              <span style={{ width: `${writing}%` }} />
            </div>
          </div>
          <div className="learn-stat-bar">
            <label>
              <span>Listening</span>
              <span>{listening}%</span>
            </label>
            <div className="learn-progress">
              <span style={{ width: `${listening}%` }} />
            </div>
          </div>
        </div>
      </div>
    </LearnShell>
  );
}
