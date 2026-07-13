import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/admin";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        // name 이 비어 있으면 username 으로 표시 (이메일 가입 사용자)
        const displayName = user.name?.trim() || user.username || user.email;
        return {
          id: user.id,
          email: user.email,
          name: displayName,
          image: user.image,
          username: user.username ?? undefined,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    jwt({ token, user }) {
      // 로그인 시마다 토큰에 해당 사용자 정보를 다시 심어, 다른 계정 전환 시 프로필이 갱신되게 한다.
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
        const username =
          "username" in user && typeof user.username === "string"
            ? user.username
            : undefined;
        if (username) token.username = username;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (token?.id) session.user.id = token.id as string;
        if (typeof token?.name === "string") session.user.name = token.name;
        if (typeof token?.email === "string") session.user.email = token.email;
        if (typeof token?.picture === "string") session.user.image = token.picture;
        if (typeof token?.username === "string") session.user.username = token.username;
        session.user.isAdmin = isAdminEmail(session.user.email);
      }
      return session;
    },
  },
});
