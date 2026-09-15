import { auth, signIn, signOut } from "@/auth";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ android?: string }>;
}) {
  const session = await auth();
  const { android } = await searchParams;
  if (session?.user && android === "1") {
    redirect("/android");
  }

  return (
    <main style={{ minHeight: "100vh", background: "#0a0a0a", color: "#f4f4f5", padding: 32, maxWidth: 480 }}>
      <a href="/" style={{ color: "#a1a1aa" }}>
        Back
      </a>
      <h1>Sign in to Lyan</h1>
      <p style={{ color: "#a1a1aa" }}>
        Optional identity via Vercel (GitHub or Google). Chats stay in this browser. Android returns via lyan://auth.
      </p>
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
            style={{ marginTop: 12 }}
          >
            <button type="submit">Continue with Google</button>
          </form>
        </>
      )}
    </main>
  );
}
