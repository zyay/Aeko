import Link from "next/link";
import { AuthGateShell } from "@/components/auth-gate-shell";
import { Mascot } from "@/components/mascot";
import { GoogleMark, Icon, Icons } from "@/components/icons";

export function AuthScreen({
  problem,
  githubReady,
  googleReady,
  github,
  google,
}: {
  problem?: string;
  githubReady: boolean;
  googleReady: boolean;
  github: () => Promise<void>;
  google: () => Promise<void>;
}) {
  return (
    <AuthGateShell>
      <div className="v-login">
        <Mascot size={28} className="flora-mark" label="Aeko" />
        <h1>Log in to Aeko</h1>
        {problem && <p className="flora-error">{problem}</p>}
        <div className="auth-forms">
          <form action={github}>
            <button type="submit" disabled={!githubReady}>
              <Icon icon={Icons.brand} size={18} aria-hidden />
              Continue with GitHub
            </button>
          </form>
          {googleReady && (
            <form action={google}>
              <button className="alt" type="submit">
                <GoogleMark size={18} />
                Continue with Google
              </button>
            </form>
          )}
        </div>
        {!githubReady && <p className="tiny">GitHub sign-in is not ready on this server yet.</p>}
        <p className="v-login-foot">
          Don&apos;t have an account? <Link href="/signup">Sign Up</Link>
        </p>
      </div>
    </AuthGateShell>
  );
}
