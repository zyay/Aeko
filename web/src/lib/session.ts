import { auth } from "@/auth";
import { emailForToken } from "@/lib/store";

export async function requireEmail(req: Request) {
  const session = await auth();
  if (session?.user?.email) return session.user.email;
  const header = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (header) {
    const email = await emailForToken(header);
    if (email) return email;
  }
  return null;
}
