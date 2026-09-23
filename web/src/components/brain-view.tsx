"use client";

import { useState } from "react";
import type { BrainConfig } from "@/components/aeko-app-types";
import { shouldUseProxy } from "@/lib/llm";
import { AppFooter, IconBack } from "@/components/ui-primitives";
import { FloraFrame } from "@/components/flora-shell";

export function BrainForm({
  userEmail,
  initial,
  onBack,
  onDone,
}: {
  userEmail: string;
  initial: BrainConfig;
  onBack: () => void;
  onDone: (cfg: BrainConfig) => void;
}) {
  const [cfg, setCfg] = useState<BrainConfig>(initial);
  const [status, setStatus] = useState("");
  const step = cfg.onboardingStep ?? (cfg.valid ? 3 : 1);

  return (
    <FloraFrame>
      <div className="flora-sheet flora-auth-card meet">
        <button className="back" type="button" onClick={onBack}>
          <IconBack /> Back to workspace
        </button>
        <h1>Settings</h1>
          <p className="sub">
            Step {step}/3 · Signed in as {userEmail}
          </p>
          {step === 1 && (
            <div className="cards">
              <button
                className={cfg.mode === "byok" ? "cardbtn on" : "cardbtn"}
                type="button"
                onClick={() => setCfg({ ...cfg, mode: "byok", baseUrl: "https://api.openai.com/v1", onboardingStep: 2 })}
              >
                API key<span>OpenAI, Groq, OpenRouter</span>
              </button>
              <button
                className={cfg.mode === "server" ? "cardbtn on" : "cardbtn"}
                type="button"
                onClick={() => setCfg({ ...cfg, mode: "server", baseUrl: "http://127.0.0.1:11434/v1", onboardingStep: 2 })}
              >
                Local server<span>Ollama, LM Studio, llama-server</span>
              </button>
            </div>
          )}
          {step >= 2 && (
            <>
              <input className="field" value={cfg.baseUrl} onChange={(e) => setCfg({ ...cfg, baseUrl: e.target.value })} placeholder="Base URL" />
              <input className="field" type="password" value={cfg.apiKey} onChange={(e) => setCfg({ ...cfg, apiKey: e.target.value })} placeholder="API key" />
              <input className="field" value={cfg.model} onChange={(e) => setCfg({ ...cfg, model: e.target.value })} placeholder="Model" />
              <button
                className={cfg.proxyViaVercel ? "cardbtn on" : "cardbtn"}
                type="button"
                onClick={() => setCfg({ ...cfg, proxyViaVercel: !cfg.proxyViaVercel })}
              >
                Route via server proxy<span>For local Ollama through Vercel proxy</span>
              </button>
              <button
                className="cardbtn"
                type="button"
                onClick={async () => {
                  setStatus("Testing…");
                  const { testBrain } = await import("@/lib/llm");
                  try {
                    const useProxy = shouldUseProxy(cfg.baseUrl, cfg.mode, cfg.proxyViaVercel);
                    const ok = await testBrain(cfg.baseUrl, cfg.apiKey, cfg.model, useProxy);
                    setCfg((c) => ({ ...c, valid: ok, onboardingStep: 3 }));
                    setStatus(ok ? "Connected." : "Could not reach model.");
                  } catch (e) {
                    setStatus(String(e));
                  }
                }}
              >
                Test connection
              </button>
            </>
          )}
          {step === 3 && (
            <p className="sub">End-to-end encryption: keys and message plaintext stay in your browser. The server stores ciphertext only.</p>
          )}
          <p className="tiny">{status}</p>
          <button className="blackpill full" type="button" onClick={() => onDone({ ...cfg, onboarded: true, onboardingStep: 3 })}>
            Save
          </button>
          <form action="/api/auth/signout" method="POST">
            <button className="ghostlink" type="submit" style={{ display: "block", textAlign: "center", width: "100%" }}>
              Sign out
            </button>
          </form>
          <AppFooter />
      </div>
    </FloraFrame>
  );
}
