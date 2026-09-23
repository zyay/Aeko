"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { FloraFrame } from "@/components/flora-shell";
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
    <FloraFrame>
      <div className="flora-sheet flora-auth-card">
        <h1>Adding {agent.name}</h1>
        <p>This agent is pinned to your workspace.</p>
      </div>
    </FloraFrame>
  );
}

export default function AddAgentPage() {
  return (
    <Suspense>
      <AddAgent />
    </Suspense>
  );
}
