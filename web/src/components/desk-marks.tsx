export function FolderMark() {
  return (
    <svg className="desk-mark" viewBox="0 0 180 140" aria-hidden>
      <g transform="translate(18 18)">
        <rect x="18" y="8" width="92" height="64" rx="14" fill="#FFE7A3" transform="rotate(-7 64 40)" />
        <rect x="28" y="16" width="92" height="64" rx="14" fill="#FFC2D8" transform="rotate(5 74 48)" />
        <rect x="22" y="28" width="96" height="62" rx="14" fill="#C8F5DE" />
        <path d="M8 62c0-8 6-14 14-14h36l8-10h48c8 0 14 6 14 14v40c0 8-6 14-14 14H22c-8 0-14-6-14-14V62z" fill="#4C8DFF" />
        <path d="M22 48h34c2 0 4-1 5-3l6-8" fill="none" stroke="#8CB6FF" strokeWidth="5" strokeLinecap="round" />
        <circle cx="118" cy="36" r="13" fill="#1C1C1E" />
        <path d="M118 30v12M112 36h12" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function PeopleMark() {
  return (
    <svg className="desk-mark" viewBox="0 0 180 140" aria-hidden>
      <circle cx="68" cy="58" r="22" fill="#FFC2D8" />
      <circle cx="112" cy="64" r="18" fill="#FFE7A3" />
      <path d="M28 112c6-22 22-32 40-32s34 10 40 32" fill="#4C8DFF" />
      <path d="M96 112c4-16 14-24 28-24 12 0 22 8 26 24" fill="#C8F5DE" />
    </svg>
  );
}

export function BotMark() {
  return (
    <svg className="desk-mark" viewBox="0 0 180 140" aria-hidden>
      <rect x="40" y="36" width="100" height="72" rx="22" fill="#1C1C1E" />
      <rect x="52" y="48" width="76" height="48" rx="14" fill="#4C8DFF" />
      <circle cx="74" cy="70" r="6" fill="#fff" />
      <circle cx="106" cy="70" r="6" fill="#fff" />
      <path d="M90 22v14" stroke="#FFE7A3" strokeWidth="6" strokeLinecap="round" />
      <circle cx="90" cy="18" r="6" fill="#FFC2D8" />
    </svg>
  );
}

export function KeyMark() {
  return (
    <svg className="desk-mark" viewBox="0 0 180 140" aria-hidden>
      <circle cx="68" cy="70" r="28" fill="#FFE7A3" />
      <circle cx="68" cy="70" r="12" fill="#1C1C1E" />
      <path d="M92 70h48" stroke="#4C8DFF" strokeWidth="12" strokeLinecap="round" />
      <path d="M124 70v16M140 70v10" stroke="#FFC2D8" strokeWidth="10" strokeLinecap="round" />
    </svg>
  );
}

const BY_TITLE = {
  Brief: BotMark,
  Research: FolderMark,
  Canvas: PeopleMark,
  Build: KeyMark,
} as const;

export function RoomMark({ title }: { title: string }) {
  const Mark = BY_TITLE[title as keyof typeof BY_TITLE] ?? FolderMark;
  return <Mark />;
}
