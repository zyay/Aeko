import { auth } from "@/auth";
import { ChatApp } from "@/components/chat-app";

export default async function HomePage() {
  const session = await auth();
  return <ChatApp userEmail={session?.user?.email ?? null} />;
}
