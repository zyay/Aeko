import Link from "next/link";
import { LearnShell } from "@/components/learn/shell";
import { ARTICLE } from "@/lib/learn-data";

export default function ReadPage() {
  return (
    <LearnShell
      title={ARTICLE.title}
      subtitle={ARTICLE.tags.join(" · ")}
      action={
        <Link href="/learn/vocabulary" className="learn-btn secondary sm">
          Add word
        </Link>
      }
    >
      <div className="learn-grid-2">
        <article className="learn-reader">
          <p>
            <span className="learn-highlight">Modernism</span> rejected decorative excess in favor of clarity and purpose. Architects like Le
            Corbusier argued that a house should be a machine for living — efficient, honest, and shaped by human needs.
          </p>
          <p>{ARTICLE.body.split("\n\n")[1]}</p>
          <p>{ARTICLE.body.split("\n\n")[2]}</p>
        </article>
        <aside className="learn-card soft">
          <h3>About</h3>
          <p>{ARTICLE.about}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
            {ARTICLE.tags.map((t) => (
              <span key={t} className="learn-pill sm">
                {t}
              </span>
            ))}
          </div>
          <Link href="/learn/training/word" className="learn-btn primary full" style={{ marginTop: 20 }}>
            Practice vocabulary
          </Link>
        </aside>
      </div>
    </LearnShell>
  );
}
