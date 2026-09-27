import { loadSecret, saveSecret } from "@/lib/crypto";
import type { BrainConfig } from "@/components/aeko-app-types";

const KEY = "aeko-provider-book";

export type BookedProvider = {
  id: string;
  label: string;
  baseUrl: string;
  model: string;
  valid: boolean;
};

type Stored = BookedProvider & { apiKey: string };

async function readRaw(): Promise<Stored[]> {
  if (typeof window === "undefined") return [];
  try {
    const rows = JSON.parse(localStorage.getItem(KEY) || "[]") as Stored[];
    if (!Array.isArray(rows)) return [];
    return await Promise.all(
      rows
        .filter((row) => row && typeof row.id === "string" && typeof row.baseUrl === "string")
        .slice(0, 8)
        .map(async (row) => ({
          ...row,
          label: (row.label || "Provider").slice(0, 40),
          baseUrl: row.baseUrl.slice(0, 300),
          model: (row.model || "").slice(0, 200),
          apiKey: row.apiKey ? await loadSecret(row.apiKey).catch(() => "") : "",
          valid: Boolean(row.valid),
        })),
    );
  } catch {
    return [];
  }
}

export async function listBooked(): Promise<BookedProvider[]> {
  const rows = await readRaw();
  return rows.map(({ apiKey: _k, ...row }) => row);
}

export async function upsertBooked(input: { id?: string; label: string; baseUrl: string; model: string; apiKey: string; valid: boolean }) {
  const rows = await readRaw();
  const id = input.id || `p-${Math.random().toString(36).slice(2, 8)}`;
  const merged: Stored[] = [
    ...rows.filter((row) => row.id !== id),
    {
      id,
      label: input.label.trim().slice(0, 40) || "Provider",
      baseUrl: input.baseUrl.trim().slice(0, 300),
      model: input.model.trim().slice(0, 200),
      valid: input.valid,
      apiKey: input.apiKey,
    },
  ].slice(0, 8);
  const stored = await Promise.all(merged.map(async (row) => ({ ...row, apiKey: row.apiKey ? await saveSecret(row.apiKey) : "" })));
  localStorage.setItem(KEY, JSON.stringify(stored));
  window.dispatchEvent(new Event("aeko-providers-change"));
  return id;
}

export async function removeBooked(id: string) {
  const rows = await readRaw();
  const stored = await Promise.all(
    rows
      .filter((row) => row.id !== id)
      .map(async (row) => ({ ...row, apiKey: row.apiKey ? await saveSecret(row.apiKey) : "" })),
  );
  localStorage.setItem(KEY, JSON.stringify(stored));
  window.dispatchEvent(new Event("aeko-providers-change"));
}

export async function resolveEndpoint(brain: BrainConfig, providerId?: string) {
  if (!providerId) return { baseUrl: brain.baseUrl, apiKey: brain.apiKey, model: brain.model, valid: brain.valid };
  const rows = await readRaw();
  const hit = rows.find((row) => row.id === providerId);
  if (!hit) return { baseUrl: brain.baseUrl, apiKey: brain.apiKey, model: brain.model, valid: brain.valid };
  return { baseUrl: hit.baseUrl, apiKey: hit.apiKey, model: hit.model || brain.model, valid: hit.valid };
}
