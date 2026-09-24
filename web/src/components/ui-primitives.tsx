import type { MouseEvent, ReactNode } from "react";
import type { Line } from "@/components/aeko-app-types";
import { Icon, Icons } from "@/components/icons";
import { FloraFrame } from "@/components/flora-shell";
import { MarkdownContent } from "@/components/markdown-content";
import { getAgent } from "@/lib/agents";

const COLORS = ["#5e5ce6", "#0071e3", "#64d2ff", "#30b0c7", "#ac8e68", "#86868b"];

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
      <div className="msg-tool animate-in" onContextMenu={onContextMenu}>
        <span className="msg-tool-label">
          <Icon icon={Icons.agent} size={12} aria-hidden /> Tool
        </span>
        {line.text}
      </div>
    );
  }
  const agent = line.agentId ? getAgent(line.agentId) : line.role === "aeko" ? getAgent("aeko") : null;
  const label = line.role === "member" && line.author ? line.author.split("@")[0] : agent?.name;
  return (
    <div className={`msg-line ${line.role}${streaming ? " streaming" : ""} animate-in`} onContextMenu={onContextMenu}>
      <div className="msg-stack">
        {label ? (
          <div className="msg-author">
            {agent ? (
              <img className="msg-agent-avatar" src={agent.avatar} alt="" />
            ) : null}
            {label}
          </div>
        ) : null}
        <div className="msg-bubble">
          {line.text ? <MarkdownContent text={line.text} /> : ""}
        </div>
      </div>
    </div>
  );
}

export function AppFooter() {
  return (
    <footer className="app-footer">
      <span>© 2026 Aeko</span>
      <span aria-hidden>·</span>
      <a href="https://github.com/zyay/Aeko/blob/master/LICENSE">MIT</a>
      <span aria-hidden>·</span>
      <a href="/privacy">Privacy</a>
      <span aria-hidden>·</span>
      <a href="/terms">Terms</a>
      <span aria-hidden>·</span>
      <a href="https://github.com/zyay/Aeko">GitHub</a>
    </footer>
  );
}

export function AgentDot({ busy }: { busy?: boolean }) {
  return <span className={`agent-dot${busy ? " busy" : ""}`} aria-hidden />;
}

export function IconBack() {
  return <Icon icon={Icons.back} size={18} aria-hidden />;
}

export function IconPlus() {
  return <Icon icon={Icons.plus} size={18} aria-hidden />;
}

export function IconSettings() {
  return <Icon icon={Icons.gear} size={18} aria-hidden />;
}

export function IconAttach() {
  return <Icon icon={Icons.attach} size={18} aria-hidden />;
}

export function IconFile() {
  return <Icon icon={Icons.file} size={18} aria-hidden />;
}

export function IconSend() {
  return <Icon icon={Icons.send} size={18} aria-hidden />;
}

export function IconGlobe() {
  return <Icon icon={Icons.globe} size={18} aria-hidden />;
}

export function IconSparkle() {
  return <Icon icon={Icons.agent} size={18} aria-hidden />;
}

export function IconSearch({ size = 16 }: { size?: number }) {
  return <Icon icon={Icons.search} size={size} aria-hidden />;
}

export function IconHome({ size = 16 }: { size?: number }) {
  return <Icon icon={Icons.home} size={size} aria-hidden />;
}

export function IconTask({ size = 16 }: { size?: number }) {
  return <Icon icon={Icons.task} size={size} aria-hidden />;
}

export function IconBrain({ size = 16 }: { size?: number }) {
  return <Icon icon={Icons.brain} size={size} aria-hidden />;
}

export function IconTeam({ size = 16 }: { size?: number }) {
  return <Icon icon={Icons.team} size={size} aria-hidden />;
}

export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <span className="brand-mark flora-mark" style={{ width: size, height: size }} aria-hidden>
      <i /><i /><i /><i />
    </span>
  );
}

export function LegalPage({ title, children, backHref = "/" }: { title: string; children: ReactNode; backHref?: string }) {
  return (
    <FloraFrame>
      <div className="flora-sheet" style={{ width: "min(680px, 100%)" }}>
        <a className="back" href={backHref}>
          <IconBack /> Back
        </a>
        <div className="legalbox">
          <h1>{title}</h1>
          <div className="legal-prose">{children}</div>
        </div>
        <AppFooter />
      </div>
    </FloraFrame>
  );
}

export function AndroidHandoff({ deepLink }: { deepLink: string }) {
  return (
    <FloraFrame>
      <div className="flora-sheet flora-auth-card android-card">
        <h1>Opening Aeko on Android</h1>
        <p>Your sign-in code is ready. If nothing happens, tap below.</p>
        <a className="btn-primary" href={deepLink}>
          Open Android app
        </a>
      </div>
    </FloraFrame>
  );
}
