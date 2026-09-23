import { redirect } from "next/navigation";

export default function SignInPage() {
  redirect("/login?callbackUrl=/learn/plan");
}
