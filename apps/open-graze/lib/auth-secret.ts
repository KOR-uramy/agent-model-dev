/** Auth.js JWT·세션 암호화용. 개발에서만 폴백 허용. */
export const AUTH_SECRET_FALLBACK =
  "open-graze-missing-AUTH_SECRET-placeholder-min-32-chars!";

let authSecretFallbackWarned = false;

/**
 * 요청 시점마다 env를 읽는다(Edge 미들웨어 vs Node 라우트 secret 불일치 방지).
 * `auth.config`에 고정 `secret`을 두면 `setEnvDefaults`가 env로 덮어쓰지 못한다.
 */
export function authSecretForNextAuth(): { secret?: string } {
  const s =
    process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
  if (s) return { secret: s };
  if (process.env.NODE_ENV === "production") {
    return {};
  }
  if (!authSecretFallbackWarned) {
    authSecretFallbackWarned = true;
    console.warn(
      "[open-graze] AUTH_SECRET 없음 — 개발용 임시 시크릿. apps/open-graze/.env 에 설정하세요.",
    );
  }
  return { secret: AUTH_SECRET_FALLBACK };
}
