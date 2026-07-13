import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import { WorkspaceProvider } from "@/lib/workspaceClient";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/app");
  }

  // key=userId: 다른 계정으로 로그인하면 클라이언트 상태(프로필/워크스페이스)를 통째로 리셋
  return (
    <SessionProvider session={session} refetchOnWindowFocus>
      <WorkspaceProvider key={session.user.id}>{children}</WorkspaceProvider>
    </SessionProvider>
  );
}
