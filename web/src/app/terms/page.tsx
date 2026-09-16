import { termsText } from "@/legal";

export default function TermsPage() {
  return (
    <main className="legal">
      <div className="legalbox">
        <a className="back" href="/">← Back</a>
        <pre>{termsText}</pre>
      </div>
    </main>
  );
}
