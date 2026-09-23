"use client";

export type Triage = "open" | "waiting" | "resolved" | "delegated";

const TRIAGE_KEY = "aeko-triage";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    return JSON.parse(localStorage.getItem(key) || "null") as T ?? fallback;
  } catch {
    return fallback;
  }
}

export function triageMap(): Record<string, Triage> {
  return read(TRIAGE_KEY, {});
}

export function setTriage(roomId: string, status: Triage) {
  const map = triageMap();
  map[roomId] = status;
  localStorage.setItem(TRIAGE_KEY, JSON.stringify(map));
  return map;
}

