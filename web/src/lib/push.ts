import webpush from "web-push";
import type { PushRow } from "@/lib/store";

function vapid() {
  const publicKey = process.env.AEKO_VAPID_PUBLIC || process.env.NEXT_PUBLIC_AEKO_VAPID_PUBLIC || "";
  const privateKey = process.env.AEKO_VAPID_PRIVATE || "";
  const subject = process.env.AEKO_VAPID_SUBJECT || "mailto:aeko@localhost";
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject };
}

export function vapidPublic() {
  return vapid()?.publicKey || "";
}

export async function sendRoomPushes(subs: PushRow[], payload: { title: string }) {
  const keys = vapid();
  if (!keys || subs.length === 0) return;
  webpush.setVapidDetails(keys.subject, keys.publicKey, keys.privateKey);
  const body = JSON.stringify(payload);
  await Promise.all(
    subs.map((s) =>
      webpush
        .sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
        )
        .catch(() => null),
    ),
  );
}
