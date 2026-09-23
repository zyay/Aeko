import type { SkillEntry } from "@/lib/skills-registry";

const KEY = "abc-installed-skills";
const ROOM_KEY = "aeko-room-skills";

export function listInstalledSkills(): SkillEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as SkillEntry[];
  } catch {
    return [];
  }
}

export function roomSkillIds(roomId: string | null): string[] {
  if (!roomId || typeof window === "undefined") return [];
  try {
    const map = JSON.parse(localStorage.getItem(ROOM_KEY) || "{}") as Record<string, string[]>;
    return map[roomId] ?? [];
  } catch {
    return [];
  }
}

export function toggleRoomSkill(roomId: string, skillId: string) {
  const map = JSON.parse(localStorage.getItem(ROOM_KEY) || "{}") as Record<string, string[]>;
  const current = new Set(map[roomId] ?? []);
  if (current.has(skillId)) current.delete(skillId);
  else current.add(skillId);
  map[roomId] = [...current];
  localStorage.setItem(ROOM_KEY, JSON.stringify(map));
  window.dispatchEvent(new CustomEvent("aeko-room-skills"));
  return map[roomId];
}

export function findSkill(name: string): SkillEntry | undefined {
  const q = name.trim().toLowerCase();
  if (!q) return undefined;
  return listInstalledSkills().find((s) => s.id.toLowerCase() === q || s.name.toLowerCase() === q || s.name.toLowerCase().includes(q) || q.includes(s.name.toLowerCase()));
}

function mentioned(skill: SkillEntry, prompt: string) {
  const blob = prompt.toLowerCase();
  if (blob.includes(skill.name.toLowerCase()) || blob.includes(skill.id.toLowerCase())) return true;
  return skill.tags.some((tag) => tag.length > 3 && new RegExp(`\\b${tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(prompt));
}

export function matchingSkills(prompt: string, roomId: string | null): SkillEntry[] {
  const pinned = new Set(roomSkillIds(roomId));
  return listInstalledSkills()
    .filter((s) => pinned.has(s.id) || mentioned(s, prompt))
    .slice(0, 3);
}

export function skillQuery(text: string): string | null {
  const m = text.match(/(?:^|\s)\/([a-z0-9 -]*)$/i);
  return m ? m[1]!.trim().toLowerCase() : null;
}

export function formatSkillPack(skills: SkillEntry[]) {
  if (!skills.length) return "";
  return skills
    .map((s) => `Skill ${s.name}:\n${(s.content || s.description).slice(0, 1800)}`)
    .join("\n\n")
    .slice(0, 6000);
}
