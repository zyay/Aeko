import { privacyText } from "@/legal";

export default function PrivacyPage() {
  return (
    <main style={{ background: "#0a0a0a", color: "#a1a1aa", minHeight: "100vh", padding: 24 }}>
      <a href="/" style={{ color: "#f4f4f5" }}>
        Back
      </a>
      <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>{privacyText}</pre>
    </main>
  );
}
