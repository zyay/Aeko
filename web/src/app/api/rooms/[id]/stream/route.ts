import { requireEmail } from "@/lib/session";
import { membership } from "@/lib/store";
import { eventsSince } from "@/lib/room-events";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const email = await requireEmail(req);
  if (!email) return new Response("auth", { status: 401 });
  const { id } = await ctx.params;
  if (!(await membership(id, email))) return new Response("forbidden", { status: 403 });

  const url = new URL(req.url);
  let since = Number(url.searchParams.get("since") || "0");

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (data: unknown) => controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`));
      send({ type: "connected", at: Date.now() });

      let closed = false;
      req.signal.addEventListener("abort", () => {
        closed = true;
      });

      while (!closed) {
        const batch = eventsSince(id, since);
        for (const event of batch) {
          since = Math.max(since, event.at);
          send(event);
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
