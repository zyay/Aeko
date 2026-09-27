import type { AppId } from "@/lib/connected-apps";

export function AppMark({ id }: { id: AppId }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", "aria-hidden": true as const };
  if (id === "github") {
    return (
      <svg {...common} fill="currentColor">
        <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.1-1.47-1.1-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.95 0-1.1.39-1.99 1.03-2.7-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0 1 12 6.8c.85 0 1.7.11 2.5.33 1.9-1.3 2.74-1.02 2.74-1.02.55 1.37.2 2.39.1 2.64.64.71 1.03 1.6 1.03 2.7 0 3.85-2.34 4.7-4.57 4.95.36.31.68.92.68 1.86v2.76c0 .26.18.58.69.48A10 10 0 0 0 12 2z" />
      </svg>
    );
  }
  if (id === "linear") {
    return (
      <svg {...common} fill="currentColor">
        <path d="M3 15.5 15.5 3H21v5.5L8.5 21H3v-5.5z" />
      </svg>
    );
  }
  if (id === "notion") {
    return (
      <svg {...common} fill="currentColor">
        <path d="M5 4h11l4 3.2V20H8.2L5 17.2V4zm3.2 2.2v11.2l1.6 1.2H18V8.2L15.8 6.2H8.2zM10 8h2.2v8H11L10 16V8z" />
      </svg>
    );
  }
  return (
    <svg {...common} fill="currentColor">
      <path d="M20 8a4 4 0 0 0-6.3-3.3A5.5 5.5 0 0 0 4 9.5 4.5 4.5 0 0 0 6 18h11.5A4.5 4.5 0 0 0 20 8z" />
    </svg>
  );
}
