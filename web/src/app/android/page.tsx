import { auth } from "@/auth";
import { issueToken } from "@/lib/store";
import { redirect } from "next/navigation";

export default async function AndroidLinkPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login?android=1");
  }
  const token = issueToken(session.user.email);
  const deep = `lyan://auth?email=${encodeURIComponent(session.user.email)}&name=${encodeURIComponent(session.user.name ?? "")}&token=${encodeURIComponent(token)}`;
  return (
    <main style={{ minHeight: "100vh", background: "#0a0a0a", color: "#f4f4f5", padding: 32 }}>
      <p>Opening Lyan…</p>
      <a href={deep} style={{ color: "#c4b5fd" }}>
        Return to the Android app
      </a>
      <script
        dangerouslySetInnerHTML={{
          __html: `window.location.replace(${JSON.stringify(deep)});`,
        }}
      />
    </main>
  );
}
