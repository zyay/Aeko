import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

function env(name: string) {
  return process.env[name]?.trim() || undefined;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
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
