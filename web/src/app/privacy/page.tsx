import { privacyText } from "@/legal";

export default function PrivacyPage() {
  return (
    <main className="legal">
      <div className="legalbox">
        <a href="/">← Back</a>
        <pre>{privacyText}</pre>
      </div>
    </main>
  );
}
