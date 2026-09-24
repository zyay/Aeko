export type AppId = "github" | "linear" | "notion" | "slack";

export type AppAction = {
  id: string;
  label: string;
  write?: boolean;
};

export const APP_CATALOG: { id: AppId; label: string; hint: string; placeholder: string; actions: AppAction[] }[] = [
  {
    id: "github",
    label: "GitHub",
    hint: "Classic or fine-grained token with access to the repos you want the bot to see.",
    placeholder: "github_pat_… or ghp_…",
    actions: [
      { id: "me", label: "Who am I" },
      { id: "repos", label: "List repos" },
      { id: "issues", label: "List issues" },
      { id: "issue", label: "Read issue" },
      { id: "search", label: "Search issues" },
      { id: "create_issue", label: "Create issue", write: true },
    ],
  },
  {
    id: "linear",
    label: "Linear",
    hint: "Personal API key from Linear settings.",
    placeholder: "lin_api_…",
    actions: [
      { id: "me", label: "Who am I" },
      { id: "teams", label: "List teams" },
      { id: "issues", label: "List issues" },
      { id: "create_issue", label: "Create issue", write: true },
    ],
  },
  {
    id: "notion",
    label: "Notion",
    hint: "Internal integration token. Share the pages you want the bot to read with that integration.",
    placeholder: "ntn_… or secret_…",
    actions: [
      { id: "me", label: "Who am I" },
      { id: "search", label: "Search" },
      { id: "page", label: "Read page" },
    ],
  },
  {
    id: "slack",
    label: "Slack",
    hint: "Bot token with channels:read. chat:write is needed only to post.",
    placeholder: "xoxb-…",
    actions: [
      { id: "me", label: "Who am I" },
      { id: "channels", label: "List channels" },
      { id: "post", label: "Post message", write: true },
    ],
  },
];

export function appMeta(id: string) {
  return APP_CATALOG.find((app) => app.id === id);
}

export function actionHelp(id: AppId) {
  const app = appMeta(id);
  if (!app) return "";
  return app.actions.map((action) => (action.write ? `${action.id} (writes)` : action.id)).join(", ");
}

type Built = { url: string; method: "GET" | "POST"; headers: Record<string, string>; body?: string };

function arg(args: Record<string, string>, key: string, max: number) {
  return (args[key] ?? "").replace(/[\r\n]/g, " ").trim().slice(0, max);
}

function nameArg(args: Record<string, string>, key: string, label: string) {
  const value = arg(args, key, 80);
  if (!/^[A-Za-z0-9_.-]+$/.test(value)) throw new Error(`${label} must be a plain name.`);
  return value;
}

function required(value: string, label: string) {
  if (!value) throw new Error(`Missing ${label}.`);
  return value;
}

function githubHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "Aeko",
  };
}

export function buildAppRequest(app: string, action: string, args: Record<string, string>, token: string): Built {
  const meta = appMeta(app);
  if (!meta) throw new Error("Unknown app. Use github, linear, notion, or slack.");
  if (!meta.actions.some((item) => item.id === action)) throw new Error(`${meta.label} has no action “${action}”. Use ${actionHelp(meta.id)}.`);

  if (app === "github") {
    const headers = githubHeaders(token);
    if (action === "me") return { url: "https://api.github.com/user", method: "GET", headers };
    if (action === "repos") return { url: "https://api.github.com/user/repos?per_page=12&sort=updated", method: "GET", headers };
    if (action === "issues" || action === "issue" || action === "create_issue") {
      const owner = nameArg(args, "owner", "owner");
      const repo = nameArg(args, "repo", "repo");
      if (action === "issues") return { url: `https://api.github.com/repos/${owner}/${repo}/issues?per_page=12&state=open`, method: "GET", headers };
      if (action === "issue") {
        const number = required(arg(args, "number", 12), "issue number");
        if (!/^\d+$/.test(number)) throw new Error("Issue number must be digits.");
        return { url: `https://api.github.com/repos/${owner}/${repo}/issues/${number}`, method: "GET", headers };
      }
      const title = required(arg(args, "title", 200), "title");
      const body = arg(args, "body", 4000);
      return {
        url: `https://api.github.com/repos/${owner}/${repo}/issues`,
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
      };
    }
    const query = required(arg(args, "query", 180), "query");
    return { url: `https://api.github.com/search/issues?per_page=8&q=${encodeURIComponent(query)}`, method: "GET", headers };
  }

  if (app === "linear") {
    const headers = { Authorization: token, "Content-Type": "application/json" };
    const query =
      action === "me"
        ? "{ viewer { id name email } }"
        : action === "teams"
          ? "{ teams { nodes { id name key } } }"
          : action === "issues"
            ? "{ issues(first: 12) { nodes { identifier title url state { name } } } }"
            : "mutation($title: String!, $teamId: String!, $description: String) { issueCreate(input: { title: $title, teamId: $teamId, description: $description }) { success issue { identifier title url } } }";
    const variables =
      action === "create_issue"
        ? { title: required(arg(args, "title", 200), "title"), teamId: required(arg(args, "team", 80), "team id"), description: arg(args, "body", 4000) }
        : undefined;
    return { url: "https://api.linear.app/graphql", method: "POST", headers, body: JSON.stringify({ query, variables }) };
  }

  if (app === "notion") {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    };
    if (action === "me") return { url: "https://api.notion.com/v1/users/me", method: "GET", headers };
    if (action === "search") {
      return {
        url: "https://api.notion.com/v1/search",
        method: "POST",
        headers,
        body: JSON.stringify({ query: arg(args, "query", 180), page_size: 8 }),
      };
    }
    const page = required(arg(args, "page", 40), "page id");
    if (!/^[0-9a-f-]{32,36}$/i.test(page)) throw new Error("Page id must be the Notion id, not a URL.");
    return { url: `https://api.notion.com/v1/pages/${page}`, method: "GET", headers };
  }

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  if (action === "me") return { url: "https://slack.com/api/auth.test", method: "POST", headers, body: "{}" };
  if (action === "channels") return { url: "https://slack.com/api/conversations.list?limit=20&exclude_archived=true&types=public_channel", method: "GET", headers };
  const channel = required(arg(args, "channel", 80), "channel");
  if (!/^[#@]?[A-Za-z0-9_-]+$/.test(channel)) throw new Error("Channel must be an id or a plain name.");
  const text = required(arg(args, "text", 3000), "text");
  return { url: "https://slack.com/api/chat.postMessage", method: "POST", headers, body: JSON.stringify({ channel, text }) };
}

export function accountFrom(app: string, raw: string) {
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    if (app === "github" && typeof data.login === "string") return data.login;
    if (app === "linear") {
      const viewer = (data.data as { viewer?: { name?: string; email?: string } } | undefined)?.viewer;
      return viewer?.name || viewer?.email || "";
    }
    if (app === "notion" && typeof data.name === "string") return data.name;
    if (app === "slack") {
      const user = typeof data.user === "string" ? data.user : "";
      const team = typeof data.team === "string" ? data.team : "";
      return [user, team].filter(Boolean).join(" @ ");
    }
  } catch {
    return "";
  }
  return "";
}

export function appCallFailed(app: string, status: number, raw: string) {
  if (status >= 400) return true;
  try {
    const data = JSON.parse(raw) as { ok?: boolean; object?: string; errors?: unknown[] };
    if (app === "slack" && data.ok === false) return true;
    if (app === "linear" && Array.isArray(data.errors) && data.errors.length > 0) return true;
    if (app === "notion" && data.object === "error") return true;
  } catch {
    return false;
  }
  return false;
}

export function explainAppResponse(app: string, status: number, raw: string, token: string) {
  const clipped = raw.slice(0, 12_000).split(token).join("[token]");
  let data: Record<string, unknown> | null = null;
  try {
    data = JSON.parse(clipped) as Record<string, unknown>;
  } catch {
    data = null;
  }
  if (app === "slack" && data?.ok === false) {
    const reason = typeof data.error === "string" ? data.error : "rejected";
    if (reason === "invalid_auth" || reason === "not_authed" || reason === "token_revoked") return "Slack rejected the token. Paste a current bot token in Settings.";
    if (reason === "missing_scope") return "The Slack token is missing permission for that action.";
    return `Slack refused the call (${reason}).`;
  }
  if (status === 401) return `${appMeta(app)?.label ?? "The app"} rejected the token. Reconnect it in Settings.`;
  if (status === 403) return `${appMeta(app)?.label ?? "The app"} refused permission. Check the token scopes, or share the page with the integration.`;
  if (status === 404) return "Not found. Check the name, and that this token can see it.";
  if (status === 429) return "The app rate-limited this call. Wait a moment and try again.";
  if (status >= 400) {
    const message = data && typeof data.message === "string" ? data.message : clipped.slice(0, 400);
    return `${appMeta(app)?.label ?? "The app"} returned ${status}. ${message}`;
  }
  if (data && Array.isArray((data as { errors?: unknown }).errors) && (data as { errors: unknown[] }).errors.length) {
    return `Linear returned an error. ${JSON.stringify((data as { errors: unknown[] }).errors).slice(0, 500)}`;
  }
  return JSON.stringify(data ?? clipped, null, 2).slice(0, 8000);
}
