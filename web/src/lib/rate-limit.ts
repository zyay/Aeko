type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function cleanIp(value: string) {
  const ip = value.trim();
  if (!ip || ip.length > 80 || /\s/.test(ip)) return "";
  return ip;
}

export function requestIp(req: Request) {
  const vercel = cleanIp(req.headers.get("x-vercel-forwarded-for")?.split(",")[0] ?? "");
  if (vercel) return vercel;
  const real = cleanIp(req.headers.get("x-real-ip") ?? "");
  if (real && !real.includes(",")) return real;
  const parts = (req.headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((part) => cleanIp(part))
    .filter(Boolean);
  return parts[parts.length - 1] || "unknown";
}

function memoryLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

async function redisLimit(key: string, limit: number, windowMs: number) {
  const url = process.env.UPSTASH_REDIS_REST_URL?.replace(/[\r\n]/g, "").trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.replace(/[\r\n]/g, "").trim();
  if (!url || !token) return null;
  const slot = Math.floor(Date.now() / windowMs);
  const redisKey = `aeko:rl:${key}:${slot}`;
  try {
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["PEXPIRE", redisKey, String(windowMs), "NX"],
      ]),
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { result?: number }[];
    const count = Number(data?.[0]?.result ?? 0);
    if (!Number.isFinite(count)) return null;
    return count <= limit;
  } catch {
    return null;
  }
}

export async function rateLimit(key: string, limit = 30, windowMs = 60_000) {
  const remote = await redisLimit(key, limit, windowMs);
  if (remote !== null) return remote;
  return memoryLimit(key, limit, windowMs);
}
