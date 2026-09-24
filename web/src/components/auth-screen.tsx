import { signIn } from "@/auth";
import { AuthGateShell } from "@/components/auth-gate-shell";
import { Mascot } from "@/components/mascot";
import { AppFooter } from "@/components/ui-primitives";
import { GoogleMark, Icon, Icons } from "@/components/icons";
import { LockIcon } from "@primer/octicons-react";

export function AuthScreen({
  after,
  error,
}: {
  after: string;
  error?: string;
}) {
  return (
    <AuthGateShell>
      <Mascot size={72} className="flora-mark flora-mark-lg" label="Aeko" />
      <p className="auth-tag">Intelligence without surveillance.</p>
      <h1>Sign in</h1>
      <p>Pick a provider. Your keys never leave your device — we only verify who you are.</p>
      {error && <p className="flora-error">{signInProblem(error)}</p>}
      <div className="auth-forms">
        <form
          action={async () => {
            "use server";
            await signIn("github", { redirectTo: after });
          }}
        >
          <button type="submit">
            <Icon icon={Icons.brand} size={18} aria-hidden />
            Continue with GitHub
          </button>
        </form>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: after });
          }}
        >
          <button className="alt" type="submit">
            <GoogleMark size={18} />
            Continue with Google
          </button>
        </form>
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

function signInProblem(error?: string) {
  if (error === "Configuration") return "Sign-in is not configured on this server.";
  if (error === "AccessDenied") return "Access was denied.";
  if (error === "OAuthAccountNotLinked") return "This email is already linked to the other provider.";
  return "GitHub or Google could not finish sign-in. Try again.";
}
