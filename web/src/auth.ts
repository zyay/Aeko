import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

function env(name: string) {
  const raw = process.env[name];
  if (!raw) return undefined;
  const value = raw.replace(/\\r\\n/g, "").replace(/[\r\n"]/g, "").trim();
  return value || undefined;
}

const authUrl = env("AUTH_URL");
if (authUrl) process.env.AUTH_URL = authUrl;
const trust = env("AUTH_TRUST_HOST");
if (trust) process.env.AUTH_TRUST_HOST = trust;
const secret = env("AUTH_SECRET");
if (secret) process.env.AUTH_SECRET = secret;

const providers = [];
const githubId = env("AUTH_GITHUB_ID");
const githubSecret = env("AUTH_GITHUB_SECRET");
if (githubId && githubSecret) {
  providers.push(GitHub({ clientId: githubId, clientSecret: githubSecret, authorization: { params: { scope: "read:user user:email" } } }));
}
const googleId = env("AUTH_GOOGLE_ID");
const googleSecret = env("AUTH_GOOGLE_SECRET");
if (googleId && googleSecret) {
  providers.push(Google({ clientId: googleId, clientSecret: googleSecret, authorization: { params: { scope: "openid email profile" } } }));
}

const secureCookie = process.env.NODE_ENV === "production";
const day = 24 * 60 * 60;

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret,
  session: { strategy: "jwt", maxAge: day },
  jwt: { maxAge: day },
  cookies: {
    sessionToken: {
      name: secureCookie ? "__Secure-authjs.session-token" : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: secureCookie,
        maxAge: day,
      },
    },
  },
  logger: {
    error(error) {
      const type = error instanceof Error ? error.name : "Error";
      console.error("[auth]", type, error instanceof Error ? error.message : String(error));
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers,
  callbacks: {
    async signIn({ account }) {
      return account?.provider === "github" || account?.provider === "google";
    },
    async jwt({ token, account }) {
      if (account) {
        const session = token as Record<string, unknown>;
        delete session.access_token;
        delete session.refresh_token;
        delete session.id_token;
      }
      return token;
    },
  },
});
