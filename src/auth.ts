import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/admin";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // 커스텀 도메인(www.zeffai.com)에서 세션 쿠키/호스트 검증이 깨지지 않도록
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      // Google 계정 이메일로 관리자 판별 — 이메일 scope 보장
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "online",
          response_type: "code",
        },
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    jwt({ token, user, account, profile }) {
      // 로그인 시마다 토큰에 해당 사용자 정보를 다시 심어, 다른 계정 전환 시 프로필이 갱신되게 한다.
      if (user) {
        token.id = user.id;
        token.name = user.name;
        if (typeof user.email === "string" && user.email) {
          token.email = user.email.trim().toLowerCase();
        }
        token.picture = user.image;
      }
      // Google profile 에서 이메일이 오면 JWT 에 강제 반영 (세션 이메일 누락 방지)
      if (account?.provider === "google" && profile && typeof profile === "object") {
        const pe = (profile as { email?: string }).email;
        if (typeof pe === "string" && pe) {
          token.email = pe.trim().toLowerCase();
        }
      }
      // 매 요청 관리자 여부 재계산
      const email =
        (typeof token.email === "string" && token.email) ||
        (user && typeof user.email === "string" ? user.email : null);
      const normalized = email ? String(email).trim().toLowerCase() : null;
      if (normalized) token.email = normalized;
      token.isAdmin = isAdminEmail(normalized);
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (token?.id) session.user.id = token.id as string;
        if (typeof token?.name === "string") session.user.name = token.name;
        if (typeof token?.email === "string") {
          session.user.email = token.email.trim().toLowerCase();
        }
        if (typeof token?.picture === "string") session.user.image = token.picture;
        session.user.isAdmin =
          token?.isAdmin === true || isAdminEmail(session.user.email);
      }
      return session;
    },
  },
  events: {
    // 로그인 시 1회 활동 갱신·휴면 복구 (세션 콜백 매 요청 부하 방지)
    async signIn({ user }) {
      if (user?.id) {
        const { touchUserActivity } = await import("@/lib/activity");
        await touchUserActivity(user.id);
      }
    },
  },
});
