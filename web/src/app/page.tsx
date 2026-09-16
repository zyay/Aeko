import { auth } from "@/auth";
import { LyanApp } from "@/components/lyan-app";

export default async function HomePage() {
  const session = await auth();
  return <LyanApp userEmail={session?.user?.email ?? null} />;
}
