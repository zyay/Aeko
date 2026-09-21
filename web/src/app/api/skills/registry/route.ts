import { NextResponse } from "next/server";
import { CURATED_SKILLS, SKILL_CATEGORIES } from "@/lib/skills-registry";

export async function GET() {
  return NextResponse.json({
    categories: SKILL_CATEGORIES,
    curated: CURATED_SKILLS,
    discoverableEstimate: 10000,
    sources: [
      "GitHub code search: filename:SKILL.md",
      "GitHub repos: cursor skill agent",
      "GitHub repos: mcp-server",
    ],
  });
}
