"use client";

import JSZip from "jszip";
import type { SkillEntry } from "@/lib/skills-registry";

const KEY = "abc-installed-skills";

export function listInstalledSkills(): SkillEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as SkillEntry[];
  } catch {
    return [];
  }
}

export function isSkillInstalled(id: string) {
  return listInstalledSkills().some((s) => s.id === id);
}

function parseGithubRepo(repo: string, skill: SkillEntry) {
  if (skill.githubOwner && skill.githubRepo) {
    return { owner: skill.githubOwner, repo: skill.githubRepo, path: skill.path ?? "SKILL.md" };
  }
  const m = repo.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (m) return { owner: m[1], repo: m[2].replace(/\.git$/, ""), path: skill.path ?? "SKILL.md" };
  return null;
}

export async function fetchSkillContent(skill: SkillEntry): Promise<SkillEntry> {
  const parsed = parseGithubRepo(skill.repo, skill);
  if (!parsed) return skill;
  const qs = new URLSearchParams(parsed);
  const res = await fetch(`/api/skills/fetch?${qs}`);
  if (!res.ok) return skill;
  const json = (await res.json()) as { content?: string; sha?: string | null; path?: string };
  return {
    ...skill,
    content: json.content,
    sha: json.sha ?? null,
    path: json.path ?? skill.path,
    installedAt: Date.now(),
  };
}

export async function installSkill(skill: SkillEntry) {
  const list = listInstalledSkills();
  if (list.some((s) => s.id === skill.id)) return list;
  const enriched = await fetchSkillContent(skill);
  const next = [{ ...enriched, source: skill.source ?? "curated" }, ...list];
  localStorage.setItem(KEY, JSON.stringify(next.slice(0, 200)));
  window.dispatchEvent(new CustomEvent("abc-skills-change"));
  return next;
}

export function removeSkill(id: string) {
  const next = listInstalledSkills().filter((s) => s.id !== id);
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("abc-skills-change"));
  return next;
}

export function exportSkillsMarkdown(skills: SkillEntry[]) {
  return skills
    .map(
      (s) =>
        `## ${s.name}\n\n${s.description}\n\n- Repo: ${s.repo}\n- Tags: ${s.tags.join(", ")}\n- Niche: ${s.niche ?? "General"}\n${s.content ? `\n\`\`\`markdown\n${s.content.slice(0, 2000)}\n\`\`\`\n` : ""}`,
    )
    .join("\n");
}

export async function exportSkillsZip(skills: SkillEntry[]) {
  const zip = new JSZip();
  for (const s of skills) {
    const folder = zip.folder(s.id.replace(/[^\w-]/g, "-")) ?? zip;
    const body = s.content || `# ${s.name}\n\n${s.description}\n\nRepo: ${s.repo}\n`;
    folder.file("SKILL.md", body);
  }
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "cursor-skills.zip";
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadText(filename: string, text: string, mime = "text/markdown") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
