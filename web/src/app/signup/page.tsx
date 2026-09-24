import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";
import { SetupForm } from "@/components/setup-form";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  const { callbackUrl, error } = await searchParams;
  const after = callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/";
  if (session?.user) redirect(after);

  async function continueGithub() {
    "use server";
    await signIn("github", { redirectTo: after });
  }

  async function continueGoogle() {
    "use server";
    await signIn("google", { redirectTo: after });
  }

  return <SetupForm after={after} error={error} github={continueGithub} google={continueGoogle} />;
}
