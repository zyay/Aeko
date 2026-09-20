import { auth } from "@/auth";
import { AekoApp } from "@/components/aeko-app";
import { normEmail } from "@/lib/store";
import { redirect } from "next/navigation";

export default async function TaskPage({ params }: { params: Promise<{ roomId: string }> }) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  const { roomId } = await params;
  return <AekoApp userEmail={normEmail(session.user.email)} initialRoomId={roomId} initialView="chat" />;
}
