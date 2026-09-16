import { auth } from "@/auth";
import { AekoApp } from "@/components/aeko-app";

export default async function HomePage() {
  const session = await auth();
  return <AekoApp userEmail={session?.user?.email ?? null} />;
}
