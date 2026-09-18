import type { ReactNode } from "react";

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
      <path
        d="M12 15a3 3 0 100-6 3 3 0 000 6z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
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
      <path
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function IconSend() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M22 2l-7 20-4-9-9-4 20-7z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type Line = { id: string; role: "user" | "aeko" | "tool"; text: string };

export function MessageRow({
  line,
  busy,
  userLabel,
  onContextMenu,
}: {
  line: Line;
  busy?: boolean;
  userLabel: string;
  onContextMenu: (e: React.MouseEvent) => void;
}) {
  const streaming = busy && line.role === "aeko" && !line.text;
  const label = line.role === "user" ? userLabel : line.role === "tool" ? "Tool" : "Aeko";
  const avatar = line.role === "user" ? userLabel[0]?.toUpperCase() : line.role === "tool" ? "⌘" : "✦";

  return (
    <article
      className={`msg-row ${line.role}${streaming ? " streaming" : ""}`}
      onContextMenu={onContextMenu}
    >
      <div className={`msg-avatar ${line.role}`}>{avatar}</div>
      <div className="msg-stack">
        <div className="msg-meta">
          <span className="msg-label">{label}</span>
          {line.role === "tool" && <span className="msg-tag">search / fetch</span>}
        </div>
        <div className={`msg-bubble ${line.role}`}>
          {line.text || (streaming ? "" : "")}
        </div>
      </div>
    </article>
  );
}

export function AppFooter() {
  return (
    <footer className="app-footer">
      <a href="/privacy">Privacy</a>
      <span>·</span>
      <a href="/terms">Terms</a>
    </footer>
  );
}

export function LegalPage({ title, children, backHref = "/" }: { title: string; children: ReactNode; backHref?: string }) {
  return (
    <main className="aeko-root legal-page">
      <div className="legal-shell">
        <a className="back" href={backHref}>
          ← Back
        </a>
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
        <p>Your sign-in code is ready. If nothing happens, tap the button below.</p>
        <a className="blackpill" href={deepLink}>
          Open Android app
        </a>
        <p className="tiny auth-foot">
          Deep link: <code>{deepLink.slice(0, 48)}…</code>
        </p>
      </div>
    </main>
  );
}
