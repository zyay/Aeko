import Link from "next/link";
import "./learn.css";

export default function LearnWelcomePage() {
  return (
    <div className="learn-root learn-welcome">
      <div className="learn-brand" style={{ fontSize: 22 }}>
        <div className="learn-logo" aria-hidden>
          <span />
        </div>
        abc
      </div>
      <h1>Learn English easily</h1>
      <p>Personal plan, library, vocabulary, exams, and GPT conversation — in one intelligent workspace.</p>
      <div className="learn-welcome-actions">
        <Link href="/learn/auth/signup" className="learn-btn primary">
          Sign up
        </Link>
        <Link href="/learn/auth/signin" className="learn-btn secondary">
          Sign in
        </Link>
        <Link href="/learn/skills" className="learn-btn secondary">
          Skills hub
        </Link>
        <Link href="/learn/mcp" className="learn-btn secondary">
          MCP studio
        </Link>
      </div>
    </div>
  );
}
