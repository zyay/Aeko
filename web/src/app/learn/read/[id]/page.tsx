"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { LearnShell } from "@/components/learn/shell";
import { getArticle } from "@/lib/learn-data";
import { addWord, completeTask, markItemComplete } from "@/lib/learn-store";

function highlightBody(body: string, words: string[]) {
  const parts = body.split(/(\n\n)/);
  return parts.map((part, pi) => {
    if (part === "\n\n") return <br key={`br-${pi}`} />;
    const tokens = part.split(/(\s+)/);
    return (
      <span key={`p-${pi}`}>
        {tokens.map((tok, ti) => {
          const clean = tok.replace(/[^a-zA-Z]/g, "").toLowerCase();
          if (words.includes(clean)) {
            return (
              <button
                key={`${pi}-${ti}`}
                type="button"
                className="learn-highlight learn-highlight-btn"
                onClick={() => {
                  addWord({
                    word: clean,
                    definition: `From reading: ${clean}`,
                    example: tok.trim(),
                  });
                }}
              >
                {tok}
              </button>
            );
          }
          return <span key={`${pi}-${ti}`}>{tok}</span>;
        })}
      </span>
    );
  });
}

export default function ReadPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id ?? "modernism");
  const article = getArticle(id);

  if (!article) {
    return (
      <LearnShell title="Not found" subtitle="This article is not in the library.">
        <button type="button" className="learn-btn primary" onClick={() => router.push("/learn/library")}>
          Back to library
        </button>
      </LearnShell>
    );
  }

  const highlights = article.highlights ?? [];
  const minutes = article.minutes;

  function finishReading() {
    markItemComplete(id);
    completeTask("read", minutes);
  }

  return (
    <LearnShell
      title={article.title}
      subtitle={article.tags.join(" · ")}
      action={
        <Link href="/learn/vocabulary" className="learn-btn secondary sm">
          Vocabulary
        </Link>
      }
    >
      <div className="learn-grid-2">
        <article className="learn-reader">
          {article.body.split("\n\n").map((para, i) => (
            <p key={i}>{highlightBody(para, highlights)}</p>
          ))}
          <button type="button" className="learn-btn primary" style={{ marginTop: 20 }} onClick={finishReading}>
            Mark as read
          </button>
        </article>
        <aside className="learn-card soft">
          <h3>About</h3>
          <p>{article.about}</p>
          <p style={{ fontSize: 13, color: "var(--learn-muted)", marginTop: 12 }}>Tap highlighted words to save them.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
            {article.tags.map((t) => (
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
