import Link from "next/link";
import { LearnAuthShell } from "@/components/learn/shell";

export default function SignUpPage() {
  return (
    <LearnAuthShell>
      <div className="learn-auth-card">
        <h1>Create account</h1>
        <p className="sub">Start your personal plan in under a minute.</p>
        <form>
          <div className="learn-field">
            <label htmlFor="name">Name</label>
            <input id="name" placeholder="Your name" />
          </div>
          <div className="learn-field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" placeholder="you@email.com" />
          </div>
          <div className="learn-field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" placeholder="••••••••" />
          </div>
          <Link href="/learn/onboarding" className="learn-btn primary full">
            Continue
          </Link>
        </form>
        <div className="learn-divider">or</div>
        <div className="learn-social">
          <button type="button" className="learn-btn secondary full">
            Continue with Apple
          </button>
          <button type="button" className="learn-btn secondary full">
            Continue with Google
          </button>
        </div>
        <p style={{ marginTop: 20, fontSize: 13, color: "var(--learn-muted)", textAlign: "center" }}>
          Already have an account? <Link href="/learn/auth/signin">Sign in</Link>
        </p>
      </div>
    </LearnAuthShell>
  );
}
