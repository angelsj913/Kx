"use client";

import { SessionProvider } from "next-auth/react";

/** login / signup / support 등 useSession이 필요한 라우트 전용 */
export default function AuthSessionProvider({
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
