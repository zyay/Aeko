"use client";

import dynamic from "next/dynamic";

export const DynImage = dynamic(() => import("img-fx").then((m) => m.ImageGeneration), { ssr: false });
export const DynVoice = dynamic(() => import("voice-beam").then((m) => m.VoiceBeam), { ssr: false });
export const DynStrobi = dynamic(() => import("@/mascot/strobi").then((m) => m.Strobi), { ssr: false });
