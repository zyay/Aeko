import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";
import { AuthGateShell } from "@/components/auth-gate-shell";
import { AppFooter, BrandMark } from "@/components/ui-primitives";
import { GoogleMark, Icon, Icons } from "@/components/icons";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ android?: string; callbackUrl?: string }>;
}) {
  const session = await auth();
  const { android, callbackUrl } = await searchParams;
  const after = callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : android === "1" ? "/android" : "/";

  if (session?.user) redirect(after);

  return (
    <>
      <AuthGateShell>
        <div className="authcard-head">
          <BrandMark size={40} />
          <div>
            <h1>Sign in to continue</h1>
            <p>Your workspace, agents, and encrypted rooms are available after authentication.</p>
          </div>
        </div>
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
      </AuthGateShell>
      <footer className="auth-gate-footer">
        <AppFooter />
      </footer>
    </>
  );
}
