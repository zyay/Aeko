import { auth, signIn, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { BeamFrame } from "@/components/beam-frame";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ android?: string }>;
}) {
  const session = await auth();
  const { android } = await searchParams;
  if (session?.user && android === "1") redirect("/android");

  return (
    <main className="auth">
      <BeamFrame>
        <div className="authcard">
          <a href="/" style={{ color: "#a1a1aa" }}>
            ← Back to Lyan
          </a>
          <h1>Sign in</h1>
          <p>Optional GitHub or Google via Vercel Auth.js. Chats stay in this tab. Android returns through lyan://auth.</p>
          {session?.user ? (
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <p>Signed in as {session.user.email}</p>
              <button type="submit">Sign out</button>
            </form>
          ) : (
            <>
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
            </>
          )}
        </div>
      </BeamFrame>
    </main>
  );
}
