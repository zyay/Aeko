import { auth } from "@/auth";
import { issueToken } from "@/lib/store";
import { redirect } from "next/navigation";

export default async function AndroidLinkPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login?android=1");
  }
  const token = await issueToken(session.user.email);
  const deep = `lyan://auth?email=${encodeURIComponent(session.user.email)}&name=${encodeURIComponent(session.user.name ?? "")}&token=${encodeURIComponent(token)}`;
  return (
    <main className="android-open">
      <div>
      <p>Opening Lyan…</p>
      <a href={deep}>
        Return to the Android app
      </a>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `window.location.replace(${JSON.stringify(deep)});`,
        }}
      />
    </main>
  );
}
