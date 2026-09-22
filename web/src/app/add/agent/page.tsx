"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { getAgent } from "@/lib/agents";

function AddAgent() {
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get("id") || "aeko";
  const agent = getAgent(id);

  useEffect(() => {
    localStorage.setItem("aeko-pinned-agent", agent.id);
    const t = setTimeout(() => router.replace("/"), 600);
    return () => clearTimeout(t);
  }, [agent.id, router]);

  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24 }}>
      <p>
        Adding <strong>{agent.name}</strong> to your workspace…
      </p>
    </main>
  );
}

export default function AddAgentPage() {
  return (
    <Suspense>
      <AddAgent />
    </Suspense>
  );
}
