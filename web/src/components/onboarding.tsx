"use client";

import { useEffect, useState } from "react";
import { generateIdentity, loadBrain, saveBrain, type BrainConfig, type BrainMode } from "@/lib/crypto";
import { testBrain } from "@/lib/llm";

const empty: BrainConfig = {
  mode: "byok",
  baseUrl: "https://api.openai.com/v1",
  apiKey: "",
  model: "gpt-4o-mini",
  proxyViaVercel: false,
  valid: false,
  onboarded: false,
};

export function Onboarding({
  userEmail,
  onDone,
}: {
  userEmail: string | null;
  onDone: (cfg: BrainConfig) => void;
}) {
  const [step, setStep] = useState(0);
  const [cfg, setCfg] = useState<BrainConfig>(empty);
  const [status, setStatus] = useState("");

  useEffect(() => {
    loadBrain().then((b) => {
      if (b) setCfg(b);
    });
  }, []);

  async function finish() {
    const pub = await generateIdentity();
    await fetch("/api/me/keys", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ publicKey: JSON.stringify(pub) }) }).catch(() => {});
    const next = { ...cfg, onboarded: true };
    await saveBrain(next);
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      await Notification.requestPermission();
    }
    onDone(next);
  }

  async function ping() {
    setStatus("Testing…");
    try {
      const ok = await testBrain(cfg.baseUrl, cfg.apiKey, cfg.model);
      setCfg((c) => ({ ...c, valid: ok }));
      setStatus(ok ? "Key valid. Tools will stay on." : "Endpoint answered but check the model id.");
    } catch (e) {
      setCfg((c) => ({ ...c, valid: false }));
      setStatus(String(e));
    }
  }

  function pick(mode: BrainMode) {
    setCfg((c) => ({
      ...c,
      mode,
      baseUrl: mode === "byok" ? "https://api.openai.com/v1" : mode === "server" ? "http://127.0.0.1:11434/v1" : "",
    }));
    setStep(2);
  }

  return (
    <div className="onboard">
      <div className="onboard-card">
        {step === 0 && (
          <>
            <h1>Aeko</h1>
            <p>Your brain. Encrypted tasks. Same on phone and PC.</p>
            {userEmail ? <p className="ok">Signed in as {userEmail}</p> : <p>Optional sign-in for shared tasks.</p>}
            <div className="row">
              {!userEmail && (
                <a className="primary" href="/login">
                  Sign in
                </a>
              )}
              <button className="ghost" type="button" onClick={() => setStep(1)}>
                {userEmail ? "Continue" : "Continue local-only"}
              </button>
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <h1>Choose a brain</h1>
            <button className="cardbtn" type="button" onClick={() => pick("byok")}>
              <strong>API key + URL</strong>
              <span>OpenAI, Groq, OpenRouter, LM Studio</span>
            </button>
            <button className="cardbtn" type="button" onClick={() => pick("server")}>
              <strong>Own server</strong>
              <span>Any OpenAI-compatible /v1/chat/completions</span>
            </button>
            <button className="cardbtn" type="button" onClick={() => pick("gguf")}>
              <strong>Download GGUF</strong>
              <span>Hugging Face file on this device</span>
            </button>
          </>
        )}
        {step === 2 && cfg.mode !== "gguf" && (
          <>
            <h1>{cfg.mode === "byok" ? "Bring your key" : "Own server"}</h1>
            <input value={cfg.baseUrl} onChange={(e) => setCfg({ ...cfg, baseUrl: e.target.value })} placeholder="Base URL" />
            <input value={cfg.apiKey} onChange={(e) => setCfg({ ...cfg, apiKey: e.target.value })} placeholder="API key / bearer (optional for LAN)" type="password" />
            <input value={cfg.model} onChange={(e) => setCfg({ ...cfg, model: e.target.value })} placeholder="Model id" />
            <label className="tiny">
              <input type="checkbox" checked={cfg.proxyViaVercel} onChange={(e) => setCfg({ ...cfg, proxyViaVercel: e.target.checked })} />
              Proxy via Vercel (off — key stays in this browser)
            </label>
            <button className="ghost" type="button" onClick={ping}>
              Test
            </button>
            <p className="tiny">{status}</p>
            <button className="primary" type="button" onClick={() => setStep(3)}>
              Continue
            </button>
          </>
        )}
        {step === 2 && cfg.mode === "gguf" && (
          <>
            <h1>On-device GGUF</h1>
            <p>Download a GGUF in the Android app (Models). On the web, use BYOK or your own server until a WASM runtime ships.</p>
            <button className="primary" type="button" onClick={() => setStep(3)}>
              Continue
            </button>
          </>
        )}
        {step === 3 && (
          <>
            <h1>Security</h1>
            <p>Keys stay on this device. Vercel stores ciphertext rooms and emails, never your prompt to your LLM. Notifications say “new activity”, not the message.</p>
            <p>Write down a recovery passphrase in Settings later if you add a second device for the same account.</p>
            <button className="primary" type="button" onClick={() => setStep(4)}>
              Enable notifications
            </button>
          </>
        )}
        {step === 4 && (
          <>
            <h1>You’re in</h1>
            <p>Workspace is Tasks on the left, thread in the middle. Add people by email after they sign in once.</p>
            <button className="primary" type="button" onClick={finish}>
              Open workspace
            </button>
          </>
        )}
      </div>
    </div>
  );
}
