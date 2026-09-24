import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/auth-screen";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ android?: string; callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  const { android, callbackUrl, error } = await searchParams;
  const after = callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : android === "1" ? "/android" : "/";
  if (session?.user) redirect(after);
  return <AuthScreen after={after} error={error} />;
}
