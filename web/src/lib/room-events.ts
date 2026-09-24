export type RoomEvent =
  | { type: "message.new"; at: number; messageId: string }
  | { type: "member.joined"; at: number; email: string }
  | { type: "member.left"; at: number; email: string }
  | { type: "room.renamed"; at: number; title: string }
  | { type: "typing"; at: number; email: string; active: boolean };

const events = new Map<string, RoomEvent[]>();
const typing = new Map<string, Map<string, number>>();

export function pushRoomEvent(roomId: string, event: RoomEvent) {
  const list = events.get(roomId) ?? [];
  list.push(event);
  while (list.length > 200) list.shift();
  events.set(roomId, list);
}

export function eventsSince(roomId: string, since: number): RoomEvent[] {
  return (events.get(roomId) ?? []).filter((e) => e.at > since);
}

export function setTyping(roomId: string, email: string, active: boolean) {
  const room = typing.get(roomId) ?? new Map<string, number>();
  if (active) room.set(email, Date.now());
  else room.delete(email);
  typing.set(roomId, room);
  pushRoomEvent(roomId, { type: "typing", at: Date.now(), email, active });
}

export function activeTypers(roomId: string, exceptEmail?: string): string[] {
  const room = typing.get(roomId);
  if (!room) return [];
  const now = Date.now();
  const out: string[] = [];
  for (const [email, at] of room) {
    if (now - at > 5000) {
      room.delete(email);
      continue;
    }
    if (exceptEmail && email === exceptEmail) continue;
    out.push(email);
  }
  return out;
}
