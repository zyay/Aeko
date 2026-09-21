import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

const MAX_BYTES = 100_000;

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!rateLimit(`skills-fetch:${ip}`, 40, 60_000)) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const owner = req.nextUrl.searchParams.get("owner")?.trim();
  const repo = req.nextUrl.searchParams.get("repo")?.trim();
  const path = req.nextUrl.searchParams.get("path")?.trim() || "SKILL.md";
  if (!owner || !repo || path.length > 200) {
    return NextResponse.json({ error: "owner and repo required" }, { status: 400 });
  }

  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "abc-learn-app",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const res = await fetch(apiUrl, { headers, next: { revalidate: 3600 } });
  if (!res.ok) {
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${path}`;
    const raw = await fetch(rawUrl, { next: { revalidate: 3600 } });
    if (!raw.ok) return NextResponse.json({ error: "not found" }, { status: 404 });
    const text = await raw.text();
    if (text.length > MAX_BYTES) return NextResponse.json({ error: "too large" }, { status: 413 });
    return NextResponse.json({ content: text, path, owner, repo, sha: null });
  }

  const json = (await res.json()) as { content?: string; encoding?: string; sha?: string; size?: number };
  if (json.size && json.size > MAX_BYTES) return NextResponse.json({ error: "too large" }, { status: 413 });
  if (json.encoding === "base64" && json.content) {
    const text = Buffer.from(json.content.replace(/\n/g, ""), "base64").toString("utf8");
    return NextResponse.json({ content: text, path, owner, repo, sha: json.sha ?? null });
  }
  return NextResponse.json({ error: "unsupported encoding" }, { status: 422 });
}
