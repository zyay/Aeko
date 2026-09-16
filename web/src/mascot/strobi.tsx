"use client";

import { createAvatar, type AvatarController } from "@bible-strong/avatar-react";
import { useEffect, useRef } from "react";
import avatarJson from "./strobi.avatar.json";

const StrobiAvatar = createAvatar(avatarJson);

type StrobiAnim = "sleeping" | "idle" | "listening" | "thinking" | "searching" | "working" | "happy";

export function Strobi({
  animation = "sleeping",
  size = 240,
}: {
  animation?: StrobiAnim;
  size?: number;
}) {
  const avatar = useRef<AvatarController>(null);

  useEffect(() => {
    avatar.current?.play(animation);
  }, [animation]);

  return <StrobiAvatar ref={avatar} defaultAnimation={animation} size={size} ariaLabel="Lyan mascot" />;
}
