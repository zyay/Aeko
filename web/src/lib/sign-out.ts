"use server";

import { signOut } from "@/auth";

export async function signOutNow() {
  await signOut({ redirectTo: "/login" });
}
