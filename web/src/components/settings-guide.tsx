"use client";

import type { ReactNode } from "react";

export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="settings-section">
      <header className="settings-section-head">
        <h2>{title}</h2>
        <p>{description}</p>
      </header>
      <div className="settings-card">{children}</div>
    </section>
  );
}

export function SettingsRow({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="settings-row">
      <div className="settings-row-meta">
        {htmlFor ? <label htmlFor={htmlFor}>{label}</label> : <span className="settings-row-label">{label}</span>}
        {hint ? <p>{hint}</p> : null}
      </div>
      <div className="settings-row-control">{children}</div>
    </div>
  );
}

export const WORKSPACE_COPY = {
  title: "General",
  description: "This name is only on this browser. It is the title on the desk, not a new account.",
};

export const MODEL_COPY = {
  title: "Model",
  description: "The key stays in this browser. A cloud model still sees the prompt you send. Room messages stay encrypted on the device.",
};

export const AGENT_COPY = {
  title: "Agents",
  description: "The model is the engine. The bot is who answers. Pin one for new channels, or write your own.",
};

export const APP_COPY = {
  title: "Integrations",
  description: "Tokens stay in this browser. Hands uses only the actions listed on each card, and only when you ask.",
};

export const ACCOUNT_COPY = {
  title: "Account",
  description: "Save writes this device. Sign out closes GitHub or Google. Keys already here stay until you clear site data.",
};
