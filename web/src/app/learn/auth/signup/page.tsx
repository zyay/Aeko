import { redirect } from "next/navigation";

export default function SignUpPage() {
  redirect("/signup?callbackUrl=/learn/onboarding");
}
