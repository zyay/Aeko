import { privacyText } from "@/legal";

export default function PrivacyPage() {
  return (
    <main className="legal">
      <a href="/" style={{ color: "#f4f4f5" }}>
        ← Back
      </a>
      <pre className="legal">{privacyText}</pre>
    </main>
  );
}
