import Link from "next/link";
import { FloraFrame } from "@/components/flora-shell";
import { Mascot } from "@/components/mascot";
import "./learn.css";

export default function LearnWelcomePage() {
  return (
    <FloraFrame>
      <section className="flora-sheet flora-auth-card">
        <Mascot size={28} />
        <h1>Learn</h1>
        <p>Your plan, library, and practice stay on this device.</p>
        <Link href="/signup?callbackUrl=/learn/onboarding" className="learn-btn primary full">Get started</Link>
        <Link href="/login?callbackUrl=/learn/plan" className="learn-btn secondary full">Sign in</Link>
      </section>
    </FloraFrame>
  );
}
