import type { DefaultSession } from "next-auth";
import type { NextAuthConfig } from "next-auth";

/**
 * `secret`은 여기 두지 않는다. 고정값이 있으면 NextAuth `setEnvDefaults`가
 * `AUTH_SECRET`으로 덮어쓰지 못해 Edge 미들웨어와 Node 라우트 secret 이 어긋날 수 있다.
 * @see `lib/auth-secret.ts` + `auth.ts` / `middleware.ts` 의 lazy 설정
 */
export default {
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      const id =
        (typeof token.id === "string" ? token.id : null) ??
        (typeof token.sub === "string" ? token.sub : null);
      if (session.user && id) session.user.id = id;
      return session;
    },
  },
} satisfies NextAuthConfig;

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & { id: string };
  }
}
