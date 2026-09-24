export type SignInStatus = {
  secret: boolean;
  github: boolean;
  google: boolean;
  githubEndpoint: "ok" | "rejected" | "unreachable" | "missing-id";
};

function env(name: string) {
  const raw = process.env[name];
  if (!raw) return undefined;
  const value = raw.replace(/\\r\\n/g, "").replace(/[\r\n"]/g, "").trim();
  return value || undefined;
}

export function explainSignIn(error: string | undefined, status: SignInStatus) {
  if (!status.secret) return "Sign-in cannot start. This server is missing its session secret.";
  if (status.githubEndpoint === "missing-id") return "GitHub sign-in is not set up on this server.";
  if (!status.github) return "GitHub sign-in is missing its client secret on this server.";
  if (status.githubEndpoint === "rejected") return "GitHub refused the callback for this site. The OAuth app must allow /api/auth/callback/github on this host.";
  if (status.githubEndpoint === "unreachable") return "Could not reach GitHub to check the sign-in app. Try again.";
  if (error === "OAuthCallbackError" || error === "OAuthCallback") return "GitHub came back, but the code could not be exchanged. The client secret does not match the app.";
  if (error === "OAuthSignin") return "GitHub did not start the sign-in. Try again.";
  if (error === "AccessDenied") return "GitHub denied access.";
  if (error === "Callback") return "GitHub returned here, but the session could not be saved.";
  if (error === "OAuthAccountNotLinked") return "This email is already linked to the other provider.";
  if (error === "MissingCSRF") return "The sign-in form expired. Press Continue with GitHub again.";
  if (error === "Configuration" && status.secret && status.github && status.githubEndpoint === "ok") return "";
  if (error) return "GitHub could not finish sign-in. Try again.";
  return "";
}

export async function scanSignIn(origin: string): Promise<SignInStatus> {
  const githubId = env("AUTH_GITHUB_ID");
  const githubSecret = env("AUTH_GITHUB_SECRET");
  const googleId = env("AUTH_GOOGLE_ID");
  const googleSecret = env("AUTH_GOOGLE_SECRET");
  let githubEndpoint: SignInStatus["githubEndpoint"] = githubId ? "unreachable" : "missing-id";
  if (githubId) {
    try {
      const redirect = `${origin}/api/auth/callback/github`;
      const response = await fetch(
        `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(githubId)}&redirect_uri=${encodeURIComponent(redirect)}&scope=read:user`,
        { redirect: "manual", signal: AbortSignal.timeout(4000) },
      );
      const location = response.headers.get("location") || "";
      const body = await response.text();
      if (response.status >= 300 && response.status < 400 && /github\.com\/login/i.test(location)) githubEndpoint = "ok";
      else if (/redirect_uri|application not found|incorrect client/i.test(body + location)) githubEndpoint = "rejected";
      else githubEndpoint = "rejected";
    } catch {
      githubEndpoint = "unreachable";
    }
  }
  return {
    secret: Boolean(env("AUTH_SECRET")),
    github: Boolean(githubId && githubSecret),
    google: Boolean(googleId && googleSecret),
    githubEndpoint,
  };
}
