import { NextResponse } from "next/server";
import { z } from "zod";

export function rejectCrossOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return null;
  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const host = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "").split(",")[0].trim();
  if (host && parsed.host === host) return null;
  if (origin === "https://www.getaeko.com" || origin === "https://getaeko.com") return null;
  return NextResponse.json({ error: "forbidden" }, { status: 403 });
}

export async function readJson<T>(req: Request, schema: z.ZodType<T>, max = 80_000) {
  const text = await req.text();
  if (text.length > max) return { error: NextResponse.json({ error: "too large" }, { status: 413 }) };
  let json: unknown = {};
  if (text.trim()) {
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      return { error: NextResponse.json({ error: "invalid json" }, { status: 400 }) };
    }
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) return { error: NextResponse.json({ error: "invalid" }, { status: 400 }) };
  return { data: parsed.data };
}

const text = (max: number) => z.string().trim().min(1).max(max);

export const roomCreateSchema = z.object({
  title: text(120),
  wrappedKey: text(12_000),
  wrapIv: text(80),
  peerPub: text(12_000),
  kind: z.enum(["channel", "dm", "project", "canvas"]).optional(),
  visibility: z.enum(["open", "private"]).optional(),
  topic: z.string().trim().max(200).optional(),
});

export const messageSchema = z.object({
  iv: text(80),
  ciphertext: text(180_000),
  parentId: z.string().trim().max(80).optional(),
});

export const memberSchema = z.object({
  email: z.string().trim().email().max(200),
  wrappedKey: text(12_000),
  wrapIv: text(80),
  peerPub: text(12_000),
});

export const claimSchema = z.object({ code: z.string().trim().min(8).max(64) });
export const titleSchema = z.object({ title: text(120) });
export const publicKeySchema = z.object({ publicKey: text(12_000) });
export const searchSchema = z.object({ query: text(200) });
export const fetchSchema = z.object({ url: z.string().trim().url().max(2000) });
export const codeSchema = z.object({ code: text(4000) });
export const workflowSchema = z.object({
  id: z.string().trim().max(80).optional(),
  name: text(120),
  yaml: text(20_000),
  enabled: z.boolean().optional(),
});
export const hookSchema = z.object({ roomId: text(80), name: text(120) });
export const reactionSchema = z.object({ messageId: text(80), emoji: text(16) });
export const typingSchema = z.object({ active: z.boolean().optional() });
export const learnSnapshotSchema = z.object({
  snapshot: z.custom<object>((value) => Boolean(value) && typeof value === "object" && !Array.isArray(value)),
  strategy: z.enum(["merge", "replace"]).optional(),
});

export const pushSchema = z.object({
  endpoint: z.string().trim().url().max(2000),
  keys: z.object({ p256dh: text(400), auth: text(400) }),
});
