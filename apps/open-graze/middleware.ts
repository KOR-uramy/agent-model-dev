import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { NextResponse } from "next/server";

/**
 * Edge 미들웨어는 `NextAuth(() => …)` lazy 형태와 Turbopack 조합에서
 * `default` export가 함수로 인식되지 않는 경우가 있다(“must export middleware”).
 * `auth.config`에 고정 `secret`이 없으므로 여기서는 객체 형태로 두고
 * `setEnvDefaults`가 `AUTH_SECRET`을 채우게 한다. 앱 전체 JWT는 `auth.ts`의 lazy 설정과 맞춘다.
 */
const { auth } = NextAuth({ ...authConfig });

export default auth((req) => {
  if (!req.auth && req.nextUrl.pathname.startsWith("/dashboard")) {
    const u = new URL("/login", req.nextUrl.origin);
    u.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(u);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
