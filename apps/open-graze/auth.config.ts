import type { DefaultSession } from "next-auth";
import type { NextAuthConfig } from "next-auth";

let authSecretFallbackWarned = false;

const AUTH_SECRET_FALLBACK =
  "open-graze-missing-AUTH_SECRET-placeholder-min-32-chars!";

/**
 * Auth.js는 `secret` 필수. 미설정 시 폴백으로 빌드·`/api/auth/session` 500을 막는다.
 * 배포 전에는 반드시 `AUTH_SECRET`을 넣을 것(폴백은 세션 위조에 취약).
 */
function resolveAuthSecret(): string {
  const s =
    process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
  if (s) return s;
  if (!authSecretFallbackWarned) {
    authSecretFallbackWarned = true;
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[open-graze] CRITICAL: AUTH_SECRET 미설정 — 임시 시크릿 사용 중. 즉시 환경 변수를 설정하세요.",
      );
    } else {
      console.warn(
        "[open-graze] AUTH_SECRET 없음 — 개발용 임시 시크릿. apps/open-graze/.env 에 설정하세요.",
      );
    }
  }
  return AUTH_SECRET_FALLBACK;
}

/**
 * 미들웨어(Edge)에서만 사용 — Node 전용 모듈(bcrypt, Prisma) 없음.
 * 실제 Credentials provider는 `auth.ts`에서 병합한다.
 */
export default {
  secret: resolveAuthSecret(),
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
