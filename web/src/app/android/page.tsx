import { auth } from "@/auth";
import { issueClaim } from "@/lib/store";
import { redirect } from "next/navigation";

export default async function AndroidLinkPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login?android=1");
  }
  const claim = await issueClaim(session.user.email, session.user.name ?? "");
  const deep = `aeko://auth?email=${encodeURIComponent(claim.email)}&name=${encodeURIComponent(claim.name)}&code=${encodeURIComponent(claim.code)}`;
  return (
    <main className="android-open">
      <div>
        <p>Opening Aeko…</p>
        <a href={deep}>Return to the Android app</a>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `window.location.replace(${JSON.stringify(deep)});`,
        }}
      />
    </main>
  );
}
