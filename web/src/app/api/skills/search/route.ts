import { NextRequest, NextResponse } from "next/server";
import type { SkillEntry } from "@/lib/skills-registry";
import { CURATED_SKILLS } from "@/lib/skills-registry";
import { rateLimit } from "@/lib/rate-limit";

type GitHubCodeItem = {
  name: string;
  path: string;
  repository: { full_name: string; html_url: string; stargazers_count?: number; description?: string | null };
};

async function githubSearch(query: string, token?: string) {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "abc-learn-app",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`https://api.github.com/search/code?q=${encodeURIComponent(query)}&per_page=30`, {
    headers,
    next: { revalidate: 3600 },
  });
  if (!res.ok) {
    const fallback = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&per_page=30`, {
      headers,
      next: { revalidate: 3600 },
    });
    if (!fallback.ok) return { total: 0, items: [] as SkillEntry[] };
    const repoJson = (await fallback.json()) as {
      total_count: number;
      items: { id: number; full_name: string; html_url: string; stargazers_count: number; description: string | null; topics?: string[] }[];
    };
    return {
      total: repoJson.total_count,
      items: repoJson.items.map((r) => ({
        id: `gh-${r.id}`,
        name: r.full_name.split("/")[1] ?? r.full_name,
        description: r.description || "GitHub skill or agent repository",
        repo: r.html_url,
        stars: r.stargazers_count,
        tags: (r.topics ?? []).slice(0, 4),
        niche: "GitHub",
        source: "github" as const,
      })),
    };
  }

  const json = (await res.json()) as { total_count: number; items: GitHubCodeItem[] };
  return {
    total: json.total_count,
    items: json.items.map((item) => ({
      id: `gh-${item.repository.full_name}-${item.path}`.replace(/[^\w-]/g, "-"),
      name: item.path.split("/").pop()?.replace(".md", "") ?? item.name,
      description: item.repository.description || `Skill at ${item.path}`,
      repo: item.repository.html_url,
      path: item.path,
      stars: item.repository.stargazers_count,
      tags: ["skill", "github"],
      niche: item.repository.full_name.split("/")[0],
      source: "github" as const,
    })),
  };
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`skills-search:${ip}`, 30, 60_000)) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "filename:SKILL.md";
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

  const curated = CURATED_SKILLS.filter(
    (s) =>
      !q ||
      q === "filename:SKILL.md" ||
      s.name.toLowerCase().includes(q.toLowerCase()) ||
      s.tags.some((t) => t.includes(q.toLowerCase())),
  );

  const github = await githubSearch(q.includes("filename:") ? q : `${q} filename:SKILL.md`, token);

  return NextResponse.json({
    query: q,
    totalDiscoverable: github.total,
    curated,
    github: github.items,
    note: github.total > 0 ? `${github.total.toLocaleString()}+ matches on GitHub` : "Using curated catalog; set GITHUB_TOKEN for higher GitHub search limits",
  });
}
