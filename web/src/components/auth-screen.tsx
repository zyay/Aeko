import { AuthGateShell } from "@/components/auth-gate-shell";
import { Mascot } from "@/components/mascot";
import { AppFooter } from "@/components/ui-primitives";
import { GoogleMark, Icon, Icons } from "@/components/icons";
import { LockIcon } from "@primer/octicons-react";

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
      <Mascot size={72} className="flora-mark flora-mark-lg" label="Aeko" />
      <p className="auth-tag">Intelligence without surveillance.</p>
      <h1>Sign in</h1>
      <p>Continue with GitHub. Your keys never leave your device — we only verify who you are.</p>
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
      <div className="trust-row" aria-hidden>
        <span>Device</span>
        <i />
        <Icon icon={LockIcon} size={16} />
        <i />
        <span>Device</span>
      </div>
      <p className="tiny auth-foot">We see your name and avatar. Nothing else. Your messages, keys and models stay on your devices — always.</p>
      <a className="auth-back" href="https://www.getaeko.com">New here? Learn more →</a>
      <AppFooter />
    </AuthGateShell>
  );
}
