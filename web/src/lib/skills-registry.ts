export type SkillEntry = {
  id: string;
  name: string;
  description: string;
  repo: string;
  path?: string;
  stars?: number;
  tags: string[];
  niche?: string;
  source: "curated" | "github";
};

export type McpPreset = {
  id: string;
  name: string;
  description: string;
  transport: "stdio" | "sse" | "streamable-http";
  command?: string;
  args?: string[];
  url?: string;
  env?: string[];
  tags: string[];
  niche: string;
};

export const SKILL_CATEGORIES = [
  "Security",
  "DevOps",
  "Frontend",
  "Backend",
  "AI/Agents",
  "Data",
  "Mobile",
  "Testing",
  "Docs",
  "Niche",
] as const;

/** Curated high-signal skills & skill repos — GitHub search adds 10k+ more at runtime. */
export const CURATED_SKILLS: SkillEntry[] = [
  { id: "gcp-prod-security", name: "GCP Prod Security Deploy", description: "Production GCP with Cloud Run, Terraform, WAF, IAM least-privilege.", repo: "https://github.com/search?q=gcp+terraform+cloud+run+skill", tags: ["security", "gcp", "terraform"], niche: "Enterprise cloud", source: "curated" },
  { id: "create-skill", name: "Create Agent Skill", description: "Author SKILL.md files for Cursor agents.", repo: "https://github.com/search?q=SKILL.md+cursor+agent", tags: ["cursor", "authoring"], niche: "Meta", source: "curated" },
  { id: "security-review", name: "Security Review", description: "Structured security review of code changes.", repo: "https://github.com/search?q=security+review+SKILL.md", tags: ["security", "review"], niche: "AppSec", source: "curated" },
  { id: "bugbot-review", name: "Bugbot Review", description: "Automated bug-focused PR review patterns.", repo: "https://github.com/search?q=bugbot+review+skill", tags: ["review", "bugs"], niche: "Quality", source: "curated" },
  { id: "split-prs", name: "Split to PRs", description: "Split large changes into reviewable pull requests.", repo: "https://github.com/search?q=split+pull+request+skill", tags: ["git", "workflow"], niche: "Ship discipline", source: "curated" },
  { id: "sdk-typescript", name: "Cursor SDK (TypeScript)", description: "Programmatic agents via @cursor/sdk.", repo: "https://github.com/search?q=cursor+sdk+typescript", tags: ["sdk", "automation"], niche: "Platform", source: "curated" },
  { id: "sdk-python", name: "Cursor SDK (Python)", description: "Programmatic agents via cursor-sdk.", repo: "https://github.com/search?q=cursor-sdk+python", tags: ["sdk", "python"], niche: "Platform", source: "curated" },
  { id: "canvas-authoring", name: "Canvas Authoring", description: "Build .canvas.tsx analytical artifacts.", repo: "https://github.com/search?q=canvas.tsx+cursor", tags: ["ui", "canvas"], niche: "Visualization", source: "curated" },
  { id: "mcp-auth", name: "MCP Auth Patterns", description: "OAuth and token flows for MCP servers.", repo: "https://github.com/search?q=mcp+oauth+server", tags: ["mcp", "auth"], niche: "Integrations", source: "curated" },
  { id: "neon-postgres", name: "Neon Postgres", description: "Serverless Postgres patterns for edge apps.", repo: "https://github.com/search?q=neon+serverless+postgres", tags: ["data", "postgres"], niche: "Backend", source: "curated" },
  { id: "next-auth", name: "NextAuth Hardening", description: "OAuth gates, session middleware, BYOK.", repo: "https://github.com/search?q=nextauth+middleware+skill", tags: ["auth", "nextjs"], niche: "Security", source: "curated" },
  { id: "e2e-crypto", name: "E2E Room Crypto", description: "Client-side encrypt for collaborative apps.", repo: "https://github.com/search?q=e2e+encryption+room+webcrypto", tags: ["crypto", "collab"], niche: "Privacy", source: "curated" },
  { id: "react-native-parity", name: "RN Web Parity", description: "Match mobile and web agent UX.", repo: "https://github.com/search?q=react+native+agent+chat", tags: ["mobile", "react"], niche: "Cross-platform", source: "curated" },
  { id: "vercel-edge", name: "Vercel Edge Deploy", description: "Alias discipline, env scripts, CI deploy.", repo: "https://github.com/search?q=vercel+deploy+alias+skill", tags: ["devops", "vercel"], niche: "Ship", source: "curated" },
  { id: "agent-loop", name: "ReAct Agent Loop", description: "Multi-step tool loops with visible traces.", repo: "https://github.com/search?q=react+agent+tool+loop", tags: ["agents", "tools"], niche: "AI platform", source: "curated" },
  { id: "sse-rooms", name: "SSE Room Sync", description: "Replace polling with SSE for live rooms.", repo: "https://github.com/search?q=sse+nextjs+room+stream", tags: ["realtime", "sse"], niche: "Collab", source: "curated" },
  { id: "primer-dark", name: "Primer Dark UI", description: "GitHub-density dark design tokens.", repo: "https://github.com/search?q=primer+dark+design+tokens", tags: ["design", "ui"], niche: "Design system", source: "curated" },
  { id: "language-learn", name: "Language Learning UX", description: "Monochrome intelligent learning flows.", repo: "https://github.com/search?q=language+learning+app+wireframe", tags: ["education", "ux"], niche: "EdTech", source: "curated" },
  { id: "ielts-prep", name: "IELTS Prep Flows", description: "Exam mocks, vocabulary, listening drills.", repo: "https://github.com/search?q=ielts+vocabulary+app", tags: ["education", "exams"], niche: "EdTech", source: "curated" },
  { id: "web-search-tools", name: "Web Search Tools", description: "Structured search/fetch for agents.", repo: "https://github.com/search?q=agent+web+search+tool", tags: ["tools", "search"], niche: "Agents", source: "curated" },
  { id: "rate-limit-api", name: "API Rate Limits", description: "Per-user caps on tool routes.", repo: "https://github.com/search?q=rate+limit+nextjs+api", tags: ["security", "api"], niche: "Backend", source: "curated" },
  { id: "vault-encrypt", name: "Encrypted Vault", description: "Encrypt local blobs with room keys.", repo: "https://github.com/search?q=vault+encrypt+localstorage", tags: ["crypto", "storage"], niche: "Privacy", source: "curated" },
  { id: "push-notify", name: "Web Push Notify", description: "VAPID push for room events.", repo: "https://github.com/search?q=web+push+vapid+nextjs", tags: ["notifications"], niche: "Realtime", source: "curated" },
  { id: "command-palette", name: "Command Palette", description: "Ctrl+K searchable actions.", repo: "https://github.com/search?q=command+palette+react", tags: ["ux", "navigation"], niche: "Product", source: "curated" },
  { id: "thinking-orbs", name: "Thinking Orbs", description: "Agent thinking state motion.", repo: "https://github.com/search?q=thinking-orbs+react", tags: ["motion", "agents"], niche: "UX", source: "curated" },
  { id: "openapi-mcp", name: "OpenAPI → MCP", description: "Generate MCP tools from OpenAPI specs.", repo: "https://github.com/search?q=openapi+mcp+server", tags: ["mcp", "openapi"], niche: "Integrations", source: "curated" },
  { id: "playwright-e2e", name: "Playwright E2E", description: "Browser automation skill patterns.", repo: "https://github.com/search?q=playwright+SKILL.md", tags: ["testing", "e2e"], niche: "QA", source: "curated" },
  { id: "k8s-ops", name: "Kubernetes Ops", description: "Cluster debugging and deploy skills.", repo: "https://github.com/search?q=kubernetes+skill+agent", tags: ["devops", "k8s"], niche: "Infra", source: "curated" },
  { id: "rust-review", name: "Rust Safety Review", description: "Memory and concurrency review heuristics.", repo: "https://github.com/search?q=rust+code+review+skill", tags: ["rust", "review"], niche: "Systems", source: "curated" },
  { id: "solidity-audit", name: "Solidity Audit", description: "Smart contract review checklists.", repo: "https://github.com/search?q=solidity+audit+skill", tags: ["web3", "security"], niche: "Crypto", source: "curated" },
  { id: "figma-to-code", name: "Figma → Code", description: "Design handoff to React components.", repo: "https://github.com/search?q=figma+to+code+skill", tags: ["design", "frontend"], niche: "UI", source: "curated" },
  { id: "a11y-audit", name: "A11y Audit", description: "Accessibility review for web apps.", repo: "https://github.com/search?q=accessibility+audit+skill", tags: ["a11y", "review"], niche: "Inclusive design", source: "curated" },
  { id: "i18n-l10n", name: "i18n / l10n", description: "Translation workflow skills.", repo: "https://github.com/search?q=i18n+localization+skill", tags: ["i18n"], niche: "Global", source: "curated" },
  { id: "observability", name: "Observability", description: "Logs, metrics, traces for agents.", repo: "https://github.com/search?q=observability+opentelemetry+skill", tags: ["devops", "otel"], niche: "SRE", source: "curated" },
  { id: "stripe-billing", name: "Stripe Billing", description: "SaaS billing integration patterns.", repo: "https://github.com/search?q=stripe+billing+skill", tags: ["saas", "payments"], niche: "B2B", source: "curated" },
  { id: "rag-pipeline", name: "RAG Pipeline", description: "Retrieval-augmented generation workflows.", repo: "https://github.com/search?q=RAG+pipeline+skill", tags: ["ai", "rag"], niche: "ML", source: "curated" },
  { id: "prompt-engineering", name: "Prompt Engineering", description: "System prompt and eval patterns.", repo: "https://github.com/search?q=prompt+engineering+skill", tags: ["ai", "prompts"], niche: "LLM", source: "curated" },
  { id: "fine-tune", name: "Fine-tune Workflows", description: "Dataset prep and eval for fine-tunes.", repo: "https://github.com/search?q=fine+tune+dataset+skill", tags: ["ai", "training"], niche: "ML", source: "curated" },
  { id: "wasm-edge", name: "WASM on Edge", description: "WebAssembly modules on edge runtimes.", repo: "https://github.com/search?q=wasm+edge+worker", tags: ["wasm", "edge"], niche: "Performance", source: "curated" },
  { id: "graphql-schema", name: "GraphQL Schema", description: "Schema design and resolver skills.", repo: "https://github.com/search?q=graphql+schema+skill", tags: ["graphql", "api"], niche: "Backend", source: "curated" },
  { id: "event-sourcing", name: "Event Sourcing", description: "CQRS and event store patterns.", repo: "https://github.com/search?q=event+sourcing+skill", tags: ["architecture"], niche: "Backend", source: "curated" },
  { id: "llm-proxy", name: "LLM Proxy", description: "BYOK proxy routes for browser clients.", repo: "https://github.com/search?q=llm+proxy+nextjs", tags: ["ai", "security"], niche: "Agents", source: "curated" },
];

export const MCP_PRESETS: McpPreset[] = [
  { id: "github", name: "GitHub", description: "Repos, PRs, issues, checks.", transport: "stdio", command: "npx", args: ["-y", "@modelcontextprotocol/server-github"], env: ["GITHUB_PERSONAL_ACCESS_TOKEN"], tags: ["git", "ci"], niche: "Essential" },
  { id: "filesystem", name: "Filesystem", description: "Scoped file read/write.", transport: "stdio", command: "npx", args: ["-y", "@modelcontextprotocol/server-filesystem", "."], tags: ["local"], niche: "Essential" },
  { id: "brave-search", name: "Brave Search", description: "Web search for agents.", transport: "stdio", command: "npx", args: ["-y", "@modelcontextprotocol/server-brave-search"], env: ["BRAVE_API_KEY"], tags: ["search"], niche: "Research" },
  { id: "postgres", name: "Postgres", description: "Read-only SQL against Neon/Postgres.", transport: "stdio", command: "npx", args: ["-y", "@modelcontextprotocol/server-postgres"], env: ["DATABASE_URL"], tags: ["data"], niche: "Backend" },
  { id: "slack", name: "Slack", description: "Channels, threads, notifications.", transport: "stdio", command: "npx", args: ["-y", "@modelcontextprotocol/server-slack"], env: ["SLACK_BOT_TOKEN"], tags: ["collab"], niche: "Teams" },
  { id: "linear", name: "Linear", description: "Issues and project tracking.", transport: "stdio", command: "npx", args: ["-y", "@linear/mcp-server"], env: ["LINEAR_API_KEY"], tags: ["pm"], niche: "Product" },
  { id: "sentry", name: "Sentry", description: "Errors and performance traces.", transport: "stdio", command: "npx", args: ["-y", "@sentry/mcp-server"], env: ["SENTRY_AUTH_TOKEN"], tags: ["observability"], niche: "SRE" },
  { id: "notion", name: "Notion", description: "Pages and databases.", transport: "stdio", command: "npx", args: ["-y", "@notionhq/notion-mcp-server"], env: ["NOTION_TOKEN"], tags: ["docs"], niche: "Knowledge" },
  { id: "google-drive", name: "Google Drive", description: "Docs and file search.", transport: "stdio", command: "npx", args: ["-y", "@modelcontextprotocol/server-gdrive"], tags: ["storage"], niche: "Workspace" },
  { id: "puppeteer", name: "Puppeteer", description: "Headless browser automation.", transport: "stdio", command: "npx", args: ["-y", "@modelcontextprotocol/server-puppeteer"], tags: ["browser"], niche: "Automation" },
  { id: "memory", name: "Memory", description: "Persistent key-value memory for agents.", transport: "stdio", command: "npx", args: ["-y", "@modelcontextprotocol/server-memory"], tags: ["agents"], niche: "Context" },
  { id: "fetch", name: "Fetch", description: "HTTP fetch with readability.", transport: "stdio", command: "npx", args: ["-y", "@modelcontextprotocol/server-fetch"], tags: ["web"], niche: "Research" },
  { id: "21st-magic", name: "21st Magic UI", description: "Component generation MCP.", transport: "stdio", command: "npx", args: ["-y", "@21st-dev/magic"], tags: ["ui"], niche: "Frontend" },
  { id: "cloudflare", name: "Cloudflare", description: "Workers, KV, R2 ops.", transport: "sse", url: "https://bindings.mcp.cloudflare.com/sse", tags: ["edge", "infra"], niche: "Cloud" },
  { id: "supabase", name: "Supabase", description: "Auth, DB, storage control.", transport: "stdio", command: "npx", args: ["-y", "supabase-mcp"], env: ["SUPABASE_ACCESS_TOKEN"], tags: ["data", "auth"], niche: "Backend" },
];
