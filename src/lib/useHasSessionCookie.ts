"use client";

import { useSyncExternalStore } from "react";

const SESSION_COOKIE_RE = /(?:^|;\s)(?:__Secure-)?authjs\.session-token(?:=|$)/;

function readHasSessionCookie(): boolean {
  if (typeof document === "undefined") return false;
  return SESSION_COOKIE_RE.test(document.cookie);
}

/** Landing-only: detect Auth.js session cookie without SessionProvider /api/auth/session. */
export function useHasSessionCookie(): boolean {
  return useSyncExternalStore(
    () => () => {},
    readHasSessionCookie,
    () => false,
  );
}
