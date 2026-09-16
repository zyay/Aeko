import { termsText } from "@/legal";

export default function TermsPage() {
  return (
    <main className="legal">
      <a href="/" style={{ color: "#f4f4f5" }}>
        ← Back
      </a>
      <pre className="legal">{termsText}</pre>
    </main>
  );
}
