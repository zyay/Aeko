import { auth } from "@/auth";
import { issueClaim } from "@/lib/store";
import { redirect } from "next/navigation";
import { AndroidHandoff } from "@/components/ui-primitives";

export default async function AndroidLinkPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login?android=1");
  }
  const claim = await issueClaim(session.user.email, session.user.name ?? "");
  const deep = `aeko://auth?email=${encodeURIComponent(claim.email)}&name=${encodeURIComponent(claim.name)}&code=${encodeURIComponent(claim.code)}`;
  return (
    <>
      <AndroidHandoff deepLink={deep} />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.location.replace(${JSON.stringify(deep)});`,
        }}
      />
    </>
  );
}
