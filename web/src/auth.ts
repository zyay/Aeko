import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

function env(name: string) {
  const raw = process.env[name]?.trim();
  if (!raw) return undefined;
  return raw.replace(/\\r\\n/g, "").replace(/[\r\n"]/g, "").trim() || undefined;
}

const authUrl = env("AUTH_URL");
if (authUrl) process.env.AUTH_URL = authUrl;

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    GitHub({
      clientId: env("AUTH_GITHUB_ID"),
      clientSecret: env("AUTH_GITHUB_SECRET"),
    }),
    Google({
      clientId: env("AUTH_GOOGLE_ID"),
      clientSecret: env("AUTH_GOOGLE_SECRET"),
    }),
  ],
});
