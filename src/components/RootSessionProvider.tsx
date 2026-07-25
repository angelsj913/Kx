"use client";

import { SessionProvider } from "next-auth/react";

/** 루트 레이아웃용 — 불필요한 세션 폴링 없이 클라이언트 번들만 제공 */
export default function RootSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      {children}
    </SessionProvider>
  );
}
