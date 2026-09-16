import { auth } from "@/auth";
import { AekoApp } from "@/components/aeko-app";
import { normEmail } from "@/lib/store";

export default async function HomePage() {
  const session = await auth();
  const email = session?.user?.email ? normEmail(session.user.email) : null;
  return <AekoApp userEmail={email} />;
}
