import type { MouseEvent, ReactNode } from "react";
import type { Line } from "@/components/aeko-app-types";

const COLORS = ["#fb923c", "#38bdf8", "#a78bfa", "#22c55e", "#f43f5e", "#2dd4bf"];

export function taskColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length]!;
}

export function MessageRow({
  line,
  busy,
  onContextMenu,
}: {
  line: Line;
  busy?: boolean;
  onContextMenu: (e: MouseEvent) => void;
}) {
  const streaming = busy && line.role === "aeko" && !line.text;
  if (line.role === "tool") {
    return (
      <div className="msg-tool" onContextMenu={onContextMenu}>
        {line.text}
      </div>
    );
  }
  return (
    <div className={`msg-line ${line.role}${streaming ? " streaming" : ""}`} onContextMenu={onContextMenu}>
      <div className="msg-bubble">{line.text || ""}</div>
    </div>
  );
}

export function AppFooter() {
  return (
    <footer className="app-footer">
      <a href="/privacy">Privacy</a>
      <span aria-hidden>·</span>
      <a href="/terms">Terms</a>
    </footer>
  );
}

export function AgentDot({ busy }: { busy?: boolean }) {
  return <span className={`agent-dot${busy ? " busy" : ""}`} aria-hidden />;
}

export function IconBack() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconPlus() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconAttach() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconMic() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function IconFile() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function IconSend() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LegalPage({ title, children, backHref = "/" }: { title: string; children: ReactNode; backHref?: string }) {
  return (
    <main className="aeko-root legal-page">
      <div className="legal-shell">
        <a className="back" href={backHref}>← Back</a>
        <div className="legalbox">
          <h1>{title}</h1>
          <div className="legal-prose">{children}</div>
        </div>
        <AppFooter />
      </div>
    </main>
  );
}

export function AndroidHandoff({ deepLink }: { deepLink: string }) {
  return (
    <main className="aeko-root onboard">
      <div className="android-card">
        <div className="android-spinner" aria-hidden />
        <h1>Opening Aeko on Android</h1>
        <p>Your sign-in code is ready. If nothing happens, tap below.</p>
        <a className="blackpill" href={deepLink}>Open Android app</a>
      </div>
    </main>
  );
}
