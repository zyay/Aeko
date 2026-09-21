import { LearnShell } from "@/components/learn/shell";

export default function VocabularyPage() {
  return (
    <LearnShell title="New word" subtitle="Add to your personal vocabulary list">
      <div className="learn-grid-2">
        <div className="learn-card">
          <div className="learn-field">
            <label htmlFor="word">Word</label>
            <input id="word" placeholder="e.g. sustainable" />
          </div>
          <div className="learn-field">
            <label htmlFor="translation">Translation</label>
            <input id="translation" placeholder="Your language" />
          </div>
          <div className="learn-field">
            <label htmlFor="transcription">Transcription</label>
            <input id="transcription" placeholder="/səˈsteɪnəbl/" />
          </div>
          <div className="learn-field">
            <label htmlFor="example">Example sentence</label>
            <textarea id="example" rows={3} placeholder="Use the word in context…" />
          </div>
          <button type="button" className="learn-btn primary">
            Save word
          </button>
        </div>
        <div className="learn-card soft">
          <h3>Tip</h3>
          <p>Tap any word while reading to add it here automatically. Review words in Training from your daily plan.</p>
        </div>
      </div>
    </LearnShell>
  );
}
