"use client";

import { type ReactNode, useCallback, useState } from "react";

export function useMicrophone() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const start = useCallback(async () => {
    const next = await navigator.mediaDevices.getUserMedia({ audio: true });
    setStream(next);
  }, []);
  const stop = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
  }, [stream]);
  return { stream, start, stop };
}

export function VoiceBeam({
  children,
}: {
  children: ReactNode;
  stream?: MediaStream | null;
  processing?: boolean;
  theme?: string;
  type?: string;
  colorVariant?: string;
}) {
  return <div className="voice-beam">{children}</div>;
}
