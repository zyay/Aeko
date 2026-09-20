import { auth } from "@/auth";
import { AekoApp } from "@/components/aeko-app";
import { normEmail } from "@/lib/store";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  return <AekoApp userEmail={normEmail(session.user.email)} initialView="brain" />;
}
