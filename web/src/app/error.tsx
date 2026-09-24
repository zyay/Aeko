"use client";

import { FloraFrame } from "@/components/flora-shell";
import { Mascot } from "@/components/mascot";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <FloraFrame>
      <section className="flora-sheet flora-signin authcard">
        <Mascot size={64} label="Aeko" />
        <h1>Something went wrong</h1>
        <p>{error.message || "Unexpected error"}</p>
        <button type="button" className="blackpill full" onClick={() => reset()}>
          Try again
        </button>
      </section>
    </FloraFrame>
  );
}
