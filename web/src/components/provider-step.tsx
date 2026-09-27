"use client";

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import type { BrainConfig } from "@/components/aeko-app-types";
import { hostOf, isLoopback, PROVIDERS, type ProviderSpec } from "@/lib/endpoints";
import { probeProvider, type ProbeResult } from "@/lib/provider-probe";
import { listBooked, removeBooked, upsertBooked, type BookedProvider } from "@/lib/provider-book";
import { modelThinks } from "@/lib/model-think";

export function ProviderStep({
  cfg,
  setCfg,
}: {
  cfg: BrainConfig;
  setCfg: Dispatch<SetStateAction<BrainConfig>>;
}) {
  const [query, setQuery] = useState("");
  const [modelQuery, setModelQuery] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [checking, setChecking] = useState(false);
  const activeId = PROVIDERS.find((provider) => provider.baseUrl === cfg.baseUrl)?.id ?? "";

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PROVIDERS;
    return PROVIDERS.filter((provider) => `${provider.name} ${provider.baseUrl}`.toLowerCase().includes(q));
  }, [query]);

  const visibleModels = useMemo(() => {
    const q = modelQuery.trim().toLowerCase();
    if (!q) return models;
    return models.filter((id) => id.toLowerCase().includes(q));
  }, [modelQuery, models]);

  function choose(provider: ProviderSpec) {
    setModels([]);
    setStatus("");
    setModelQuery("");
    setCfg({
      ...cfg,
      mode: provider.mode,
      baseUrl: provider.baseUrl,
      model: provider.defaultModel,
      apiKey: provider.baseUrl === cfg.baseUrl ? cfg.apiKey : "",
      proxyViaVercel: false,
      valid: false,
    });
  }

  async function check() {
    setChecking(true);
    setStatus("Checking the key…");
    setModels([]);
    try {
      const result = isLoopback(cfg.baseUrl) ? await probeProvider(cfg.baseUrl, cfg.apiKey, cfg.model, true) : await checkRemote();
      setModels(result.models);
      setCfg((current) => {
        const nextModel = result.models.includes(current.model) ? current.model : result.models[0] || current.model;
        return { ...current, model: nextModel, valid: result.ok };
      });
      setStatus(result.detail);
    } catch {
      setStatus("Could not reach that provider.");
    } finally {
      setChecking(false);
    }
  }

  async function checkRemote(): Promise<ProbeResult> {
    const res = await fetch("/api/tools/models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ baseUrl: cfg.baseUrl, apiKey: cfg.apiKey, model: cfg.model }),
    });
    const data = (await res.json().catch(() => null)) as { ok?: boolean; models?: unknown; detail?: string; error?: string } | null;
    const list = Array.isArray(data?.models) ? data.models.filter((id): id is string => typeof id === "string") : [];
    if (!res.ok && !data?.detail) {
      return { ok: false, models: [], detail: data?.error || "Could not check that key." };
    }
    return { ok: Boolean(data?.ok), models: list, detail: data?.detail || data?.error || "Could not check that key." };
  }

  const local = isLoopback(cfg.baseUrl);

  return (
    <>
      <h2>Choose a provider</h2>
      <p>Paste the key for that provider. Aeko checks it here and lists the models that key can use. The key stays in this browser. A cloud model call is not end-to-end encrypted.</p>
      <label className="setup-label" htmlFor="provider-search">Provider</label>
      <input id="provider-search" className="field" value={query} placeholder="Search OpenAI, Groq, Vercel…" onChange={(e) => setQuery(e.target.value)} />
      <div className="provider-list">
        {shown.map((provider) => (
          <button key={provider.id} type="button" className={activeId === provider.id ? "provider on" : "provider"} onClick={() => choose(provider)}>
            <strong>{provider.name}</strong>
            <span>{hostOf(provider.baseUrl)}</span>
          </button>
        ))}
        {!shown.length && <p className="tiny">No provider matches that search.</p>}
      </div>
      <label className="setup-label" htmlFor="settings-base">Base URL</label>
      <input id="settings-base" className="field" value={cfg.baseUrl} onChange={(e) => { setModels([]); setCfg({ ...cfg, baseUrl: e.target.value, valid: false }); }} spellCheck={false} />
      {cfg.baseUrl.includes("{id}") && <p className="tiny">Replace {"{id}"} with your Cloudflare account id.</p>}
      <label className="setup-label" htmlFor="settings-key">API key</label>
      <input
        id="settings-key"
        className="field"
        type="password"
        value={cfg.apiKey}
        placeholder={local ? "Leave empty for a local server" : "Paste the provider key"}
        onChange={(e) => setCfg({ ...cfg, apiKey: e.target.value, valid: false })}
        autoComplete="off"
      />
      <button className="solid" type="button" disabled={checking} onClick={check}>
        {checking ? "Checking…" : "Check this key"}
      </button>
      {status && <p className={cfg.valid ? "tiny ok" : "tiny"}>{status}</p>}
      {models.length > 0 && (
        <>
          <label className="setup-label" htmlFor="model-search">Models this key can use</label>
          <input id="model-search" className="field" value={modelQuery} placeholder="Filter models" onChange={(e) => setModelQuery(e.target.value)} />
          <div className="model-list slim-scroll">
            {visibleModels.map((id) => (
              <button key={id} type="button" className={cfg.model === id ? "provider on" : "provider"} onClick={() => setCfg({ ...cfg, model: id, valid: true })}>
                <strong>{id}</strong>
              </button>
            ))}
            {!visibleModels.length && <p className="tiny">No model matches that filter.</p>}
          </div>
        </>
      )}
      <label className="setup-label" htmlFor="settings-model">Model id</label>
      <input id="settings-model" className="field" value={cfg.model} onChange={(e) => setCfg({ ...cfg, model: e.target.value })} spellCheck={false} />
      {modelThinks(cfg.model) && <p className="tiny ok">This model id looks like a thinking model. Agents will use Thinking unless you pick Fast.</p>}
      <ExtraProviders />
    </>
  );
}

function ExtraProviders() {
  const [rows, setRows] = useState<BookedProvider[]>([]);
  const [label, setLabel] = useState("");
  const [baseUrl, setBaseUrl] = useState("https://ai-gateway.vercel.sh/v1");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setRows(await listBooked());
  }

  useEffect(() => {
    void refresh();
    const onChange = () => void refresh();
    window.addEventListener("aeko-providers-change", onChange);
    return () => window.removeEventListener("aeko-providers-change", onChange);
  }, []);

  async function add() {
    setBusy(true);
    setNote("Checking this key…");
    try {
      const result = isLoopback(baseUrl) ? await probeProvider(baseUrl, apiKey, model, true) : await checkRemote(baseUrl, apiKey, model);
      await upsertBooked({
        label: label || hostOf(baseUrl),
        baseUrl,
        model: result.models.includes(model) ? model : result.models[0] || model,
        apiKey,
        valid: result.ok,
      });
      setApiKey("");
      setLabel("");
      setNote(result.ok ? "Saved on this browser. Assign it on a bot seat." : result.detail);
    } catch {
      setNote("Could not reach that provider.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="extra-providers">
      <p className="pick-label">More providers</p>
      <p className="tiny">Add another key. A bot seat can use it. Keys stay in this browser.</p>
      {rows.map((row) => (
        <div key={row.id} className="conn-row">
          <div className="conn-head">
            <strong>{row.label}</strong>
            <span>{row.valid ? "Ready" : "Not checked"} · {hostOf(row.baseUrl)}</span>
          </div>
          <p>{row.model || "No model id yet"}</p>
          <button type="button" className="tool" onClick={() => void removeBooked(row.id)}>Remove</button>
        </div>
      ))}
      <label className="setup-label" htmlFor="extra-label">Name</label>
      <input id="extra-label" className="field" value={label} placeholder="Backup OpenAI" onChange={(e) => setLabel(e.target.value)} />
      <label className="setup-label" htmlFor="extra-url">Base URL</label>
      <input id="extra-url" className="field" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} spellCheck={false} />
      <label className="setup-label" htmlFor="extra-key">API key</label>
      <input id="extra-key" className="field" type="password" value={apiKey} autoComplete="off" onChange={(e) => setApiKey(e.target.value)} />
      <label className="setup-label" htmlFor="extra-model">Model id</label>
      <input id="extra-model" className="field" value={model} onChange={(e) => setModel(e.target.value)} spellCheck={false} />
      <button className="solid" type="button" disabled={busy || !baseUrl.trim()} onClick={() => void add()}>
        {busy ? "Checking…" : "Add provider"}
      </button>
      {note && <p className="tiny">{note}</p>}
    </div>
  );
}

async function checkRemote(baseUrl: string, apiKey: string, model: string): Promise<ProbeResult> {
  const res = await fetch("/api/tools/models", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ baseUrl, apiKey, model }),
  });
  const data = (await res.json().catch(() => null)) as { ok?: boolean; models?: unknown; detail?: string; error?: string } | null;
  const list = Array.isArray(data?.models) ? data.models.filter((id): id is string => typeof id === "string") : [];
  if (!res.ok && !data?.detail) {
    return { ok: false, models: [], detail: data?.error || "Could not check that key." };
  }
  return { ok: Boolean(data?.ok), models: list, detail: data?.detail || data?.error || "Could not check that key." };
}
