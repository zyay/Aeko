"use client";

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

export function installSkill(skill: SkillEntry) {
  const list = listInstalledSkills();
  if (list.some((s) => s.id === skill.id)) return list;
  const next = [{ ...skill, source: skill.source ?? "curated" }, ...list];
  localStorage.setItem(KEY, JSON.stringify(next.slice(0, 200)));
  return next;
}

export function removeSkill(id: string) {
  const next = listInstalledSkills().filter((s) => s.id !== id);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function exportSkillsMarkdown(skills: SkillEntry[]) {
  return skills
    .map(
      (s) => `## ${s.name}\n\n${s.description}\n\n- Repo: ${s.repo}\n- Tags: ${s.tags.join(", ")}\n- Niche: ${s.niche ?? "General"}\n`,
    )
    .join("\n");
}
