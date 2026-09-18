import { auth, signIn, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { AppFooter } from "@/components/ui-primitives";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ android?: string }>;
}) {
  const session = await auth();
  const { android } = await searchParams;
  if (session?.user && android === "1") redirect("/android");
  if (session?.user && android !== "1") redirect("/");

  return (
    <main className="aeko-root onboard">
      <div className="auth-shell">
        <span className="onboard-badge">Identity only · keys stay local</span>
        <div className="auth-hero-mark" aria-hidden>
          A
        </div>
        <div className="authcard">
          <a href="/" className="back">
            ← Back to dashboard
          </a>
          <h1>Sign in to Aeko</h1>
          <p>GitHub or Google for sync. Your LLM keys never hit Vercel — only encrypted room ciphertext does.</p>
          {session?.user ? (
            <form
              className="auth-forms"
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <p className="ok">Signed in as {session.user.email}</p>
              <button type="submit">Sign out</button>
            </form>
          ) : (
            <div className="auth-forms">
              <form
                action={async () => {
                  "use server";
                  await signIn("github", { redirectTo: android === "1" ? "/android" : "/" });
                }}
              >
                <button type="submit">Continue with GitHub</button>
              </form>
              <form
                action={async () => {
                  "use server";
                  await signIn("google", { redirectTo: android === "1" ? "/android" : "/" });
                }}
              >
                <button className="alt" type="submit">
                  Continue with Google
                </button>
              </form>
            </div>
          )}
          <p className="tiny auth-foot">After sign-in you land in the encrypted task dashboard.</p>
        </div>
        <AppFooter />
      </div>
    </main>
  );
}
