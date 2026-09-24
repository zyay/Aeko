import { auth, signIn } from "@/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/auth-screen";
import { explainSignIn, scanSignIn } from "@/lib/sign-in-status";

function rethrowRedirect(error: unknown): void {
  if (error && typeof error === "object" && "digest" in error && String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")) {
    throw error;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ android?: string; callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  const { android, callbackUrl, error } = await searchParams;
  const after = callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : android === "1" ? "/android" : "/";
  if (session?.user) redirect(after);

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "localhost";
  const proto = requestHeaders.get("x-forwarded-proto") || "https";
  const status = await scanSignIn(`${proto}://${host}`);
  const problem = explainSignIn(error, status);

  async function continueGithub() {
    "use server";
    try {
      await signIn("github", { redirectTo: after });
    } catch (caught) {
      rethrowRedirect(caught);
      redirect("/login?error=OAuthSignin");
    }
  }

  async function continueGoogle() {
    "use server";
    try {
      await signIn("google", { redirectTo: after });
    } catch (caught) {
      rethrowRedirect(caught);
      redirect("/login?error=OAuthSignin");
    }
  }

  return (
    <AuthScreen
      problem={problem}
      githubReady={status.secret && status.github && status.githubEndpoint === "ok"}
      googleReady={status.secret && status.google}
      github={continueGithub}
      google={continueGoogle}
    />
  );
}
