import { auth } from "@/auth";
import { rateLimit } from "@/lib/rate-limit";
import { topicLabels } from "@/lib/learn-data";
import { NextRequest, NextResponse } from "next/server";

type TutorBody = {
  messages?: { role: "user" | "assistant"; content: string }[];
  profile?: {
    reason?: string;
    topics?: string[];
    level?: string;
    uiLanguage?: string;
  };
  tutor?: {
    baseUrl?: string;
    apiKey?: string;
    model?: string;
  };
};

function completionsUrl(baseUrl: string) {
  const root = baseUrl.replace(/\/$/, "");
  return root.endsWith("/v1") ? `${root}/chat/completions` : `${root}/v1/chat/completions`;
}

function buildSystem(profile: TutorBody["profile"]) {
  const topics = profile?.topics?.length ? topicLabels(profile.topics).join(", ") : "general topics";
  return `You are an English tutor in the abc learn app. The student learns English for: ${profile?.reason ?? "self-study"}. Level: ${profile?.level ?? "Intermediate"}. UI language: ${profile?.uiLanguage ?? "English"}. Favourite topics: ${topics}. Give concise, encouraging feedback. Correct mistakes gently. Ask one follow-up question when helpful.`;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const session = await auth();
  const rateKey = session?.user?.email ? `tutor:${session.user.email}` : `tutor:${ip}`;
  if (!rateLimit(rateKey, session?.user?.email ? 60 : 20, 60_000)) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const body = (await req.json()) as TutorBody;
  const msgs = body.messages ?? [];
  if (!msgs.length || msgs[msgs.length - 1]?.role !== "user") {
    return NextResponse.json({ error: "invalid messages" }, { status: 400 });
  }

  const baseUrl = body.tutor?.baseUrl || process.env.LEARN_TUTOR_BASE_URL || "https://api.openai.com/v1";
  const apiKey = body.tutor?.apiKey || process.env.LEARN_TUTOR_API_KEY || process.env.OPENAI_API_KEY || "";
  const model = body.tutor?.model || process.env.LEARN_TUTOR_MODEL || "gpt-6-astra";

  if (!apiKey) {
    return NextResponse.json(
      { error: "no_key", message: "Add your API key in Tutor settings or set LEARN_TUTOR_API_KEY on the server." },
      { status: 503 },
    );
  }

  const payload = {
    model,
    stream: true,
    temperature: 0.5,
    messages: [{ role: "system", content: buildSystem(body.profile) }, ...msgs],
  };

  const upstream = await fetch(completionsUrl(baseUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    return NextResponse.json({ error: "upstream", detail: text.slice(0, 300) }, { status: upstream.status });
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") || "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}
