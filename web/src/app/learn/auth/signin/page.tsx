import Link from "next/link";
import { LearnAuthShell } from "@/components/learn/shell";

export default function SignInPage() {
  return (
    <LearnAuthShell>
      <div className="learn-auth-card">
        <h1>Welcome back</h1>
        <p className="sub">Pick up where you left off with your plan.</p>
        <form>
          <div className="learn-field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" placeholder="you@email.com" />
          </div>
          <div className="learn-field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" placeholder="••••••••" />
          </div>
          <Link href="/learn/plan" className="learn-btn primary full">
            Sign in
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
          New here? <Link href="/learn/auth/signup">Sign up</Link>
        </p>
      </div>
    </LearnAuthShell>
  );
}
