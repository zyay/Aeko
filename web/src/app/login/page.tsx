import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";
import { AuthGateShell } from "@/components/auth-gate-shell";
import { AppFooter } from "@/components/ui-primitives";
import { GoogleMark, Icon, Icons } from "@/components/icons";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ android?: string; callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  const { android, callbackUrl, error } = await searchParams;
  const after = callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : android === "1" ? "/android" : "/";
  const problem = signInProblem(error);

  if (session?.user) redirect(after);

  return (
    <AuthGateShell>
      <span className="flora-mark flora-mark-lg" aria-hidden>
        <i /><i /><i /><i />
      </span>
      <h1>Sign in</h1>
      <p>GitHub or Google. Messages stay encrypted on your devices.</p>
      {problem && <p className="flora-error">{problem}</p>}
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
      <p className="tiny auth-foot">
        OAuth is identity only. Model API keys and message content never leave this device unencrypted.
      </p>
      <footer className="app-footer">
        <AppFooter />
      </footer>
    </AuthGateShell>
  );
}

function signInProblem(error?: string) {
  if (!error) return "";
  if (error === "Configuration") return "Sign-in is not configured on this server.";
  if (error === "AccessDenied") return "Access was denied.";
  if (error === "OAuthAccountNotLinked") return "This email is already linked to the other provider.";
  return "GitHub or Google could not finish sign-in. Try again.";
}
