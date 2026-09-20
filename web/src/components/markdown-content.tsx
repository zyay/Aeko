import type { ReactNode } from "react";

function inlineMarkdown(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = re.exec(text))) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith("`")) {
      parts.push(<code key={i++}>{token.slice(1, -1)}</code>);
    } else if (token.startsWith("**")) {
      parts.push(<strong key={i++}>{token.slice(2, -2)}</strong>);
    } else {
      const m = /\[([^\]]+)\]\(([^)]+)\)/.exec(token);
      if (m) parts.push(<a key={i++} href={m[2]} target="_blank" rel="noreferrer">{m[1]}</a>);
      else parts.push(token);
    }
    last = match.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function MarkdownContent({ text }: { text: string }) {
  const blocks = text.split(/```(?:[\w-]*\n)?/);
  if (blocks.length === 1) return <>{inlineMarkdown(text)}</>;

  return (
    <>
      {blocks.map((block, idx) => {
        if (idx % 2 === 1) {
          const nl = block.indexOf("\n");
          const code = nl >= 0 ? block.slice(nl + 1) : block;
          return (
            <pre key={idx} className="msg-code">
              <code>{code.replace(/\n$/, "")}</code>
            </pre>
          );
        }
        if (!block) return null;
        return <span key={idx}>{inlineMarkdown(block)}</span>;
      })}
    </>
  );
}
