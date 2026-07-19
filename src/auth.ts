import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/admin";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

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
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        // 2단계 인증을 켠 계정만 사용 — 로그인 페이지가 코드 단계에서 함께 보낸다.
        code: { label: "Code", type: "text" },
      },
      async authorize(credentials, request) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        const code = String(credentials?.code ?? "").trim();
        if (!email || !password) return null;

        // 계정 하나를 노린 분산 대입과, 한 IP가 여러 계정을 훑는 대입 둘 다 막는다.
        // bcrypt 비교 자체가 어느 정도 느리긴 하지만 시도 횟수 제한이 따로 필요하다.
        const ip = clientIp(request);
        const [ipOk, emailOk] = await Promise.all([
          checkRateLimit("login:ip", ip, { max: 20, windowSeconds: 300 }),
          checkRateLimit("login:email", email, { max: 6, windowSeconds: 300 }),
        ]);
        if (!ipOk || !emailOk) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        // 2단계 인증이 켜진 계정은 이메일로 받은 코드가 반드시 맞아야 로그인 완료.
        // (미사용 계정은 이 분기를 건너뛰어 기존 로그인 동작이 그대로 유지된다.)
        if (user.twoFactorEnabled) {
          if (!code) return null;
          const { verifyOtp } = await import("@/lib/otp");
          const codeOk = await verifyOtp(email, "login-2fa", code);
          if (!codeOk) return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  // 로그인 유지: JWT 세션을 30일간 보관하고, 활동이 있으면 하루 단위로 만료를 갱신한다.
  // (재접속 때마다 다시 로그인하지 않도록 — "로그인 상태 유지")
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60, updateAge: 24 * 60 * 60 },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // 로그인 시마다 토큰에 해당 사용자 정보를 다시 심어, 다른 계정 전환 시 프로필이 갱신되게 한다.
      if (user) {
        token.id = user.id;
        token.name = user.name;
        if (typeof user.email === "string" && user.email) {
          token.email = user.email.trim().toLowerCase();
        }
        token.picture = user.image;
      }

      // ── 세션 토큰 버전(전역 로그아웃/비번 변경 시 무효화) ──
      // JWT 전략이라 서버 세션 목록이 없다. 대신 사용자의 sessionVersion을 토큰에 심어
      // 두고, DB 값과 어긋나면 토큰을 무효화(return null)해 "다른 기기 모두 로그아웃"을
      // 구현한다. Prisma 쿼리는 엣지 런타임(미들웨어)에서 실행할 수 없으므로 node에서만
      // 검사한다 — 엣지 미들웨어를 통과하더라도 실제 데이터 접근(API·RSC)은 node에서
      // auth()를 다시 호출하므로 거기서 무효 토큰이 걸러진다. 오류 시엔 대량 로그아웃을
      // 피하려 열림(fail-open) 처리한다.
      if (process.env.NEXT_RUNTIME !== "edge" && token.id) {
        try {
          if (user) {
            // 로그인 직후: 현재 버전을 토큰에 기록
            const u = await prisma.user.findUnique({
              where: { id: String(token.id) },
              select: { sessionVersion: true },
            });
            token.sv = u?.sessionVersion ?? 0;
            token.svAt = Date.now();
          } else {
            // 토큰 갱신 경로: 과도한 DB 부하를 막으려 60초에 한 번만 재검사
            const last = typeof token.svAt === "number" ? token.svAt : 0;
            if (Date.now() - last > 60_000) {
              const u = await prisma.user.findUnique({
                where: { id: String(token.id) },
                select: { sessionVersion: true },
              });
              if (u && typeof token.sv === "number" && u.sessionVersion !== token.sv) {
                return null; // 버전 불일치 → 세션 무효화(로그아웃)
              }
              if (u) {
                token.sv = u.sessionVersion;
                token.svAt = Date.now();
              }
            }
          }
        } catch {
          /* DB 접근 실패 시 로그아웃시키지 않음(fail-open) */
        }
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
    async signIn({ user, account }) {
      if (!user?.id) return;
      const { touchUserActivity } = await import("@/lib/activity");
      await touchUserActivity(user.id);
      // 로그인 기록(보안 탭 "최근 로그인" 표시용) — 요청 헤더에서 IP·UA를 best-effort로 취득.
      try {
        const { headers } = await import("next/headers");
        const h = await headers();
        const ip =
          (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "").trim() || null;
        const ua = h.get("user-agent");
        await prisma.loginEvent.create({
          data: {
            userId: user.id,
            ip,
            userAgent: ua ?? null,
            provider: account?.provider ?? null,
          },
        });
      } catch (e) {
        console.error("[loginEvent] failed:", e);
      }
    },
  },
});
