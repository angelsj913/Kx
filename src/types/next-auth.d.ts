import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isAdmin?: boolean;
      /** 이메일 가입 시 설정한 아이디 */
      username?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    username?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string;
    isAdmin?: boolean;
  }
}
