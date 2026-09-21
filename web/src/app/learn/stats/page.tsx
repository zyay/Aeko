import { LearnShell } from "@/components/learn/shell";
import { STATS } from "@/lib/learn-data";

export default function StatsPage() {
  return (
    <LearnShell title="Statistics" subtitle={`${STATS.streak} day streak · ${STATS.minutesThisWeek} min this week`}>
      <div className="learn-grid-2">
        <div className="learn-card soft">
          <h2>Monthly activity</h2>
          <p style={{ marginBottom: 16 }}>{STATS.monthProgress}% of monthly goal completed</p>
          <div className="learn-progress" style={{ height: 10 }}>
            <span style={{ width: `${STATS.monthProgress}%` }} />
          </div>
          <div className="learn-calendar-strip" style={{ marginTop: 24 }}>
            {Array.from({ length: 28 }, (_, i) => (
              <div key={i} className={`learn-day ${i % 7 === 3 ? "today" : ""} ${i % 3 === 0 ? "done" : ""}`} style={{ padding: 6 }}>
                <strong style={{ fontSize: 12 }}>{i + 1}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="learn-card">
          <h3>Skills</h3>
          <div className="learn-stat-bar">
            <label>
              <span>Reading</span>
              <span>{STATS.reading}%</span>
            </label>
            <div className="learn-progress">
              <span style={{ width: `${STATS.reading}%` }} />
            </div>
          </div>
          <div className="learn-stat-bar">
            <label>
              <span>Writing</span>
              <span>{STATS.writing}%</span>
            </label>
            <div className="learn-progress">
              <span style={{ width: `${STATS.writing}%` }} />
            </div>
          </div>
          <div className="learn-stat-bar">
            <label>
              <span>Listening</span>
              <span>{STATS.listening}%</span>
            </label>
            <div className="learn-progress">
              <span style={{ width: `${STATS.listening}%` }} />
            </div>
          </div>
        </div>
      </div>
    </LearnShell>
  );
}
