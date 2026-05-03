import Link from "next/link";

export type AppChromeNav = "home" | "login" | "register" | "dashboard";

const navLinkClass = (active: AppChromeNav | undefined, key: AppChromeNav) =>
  [
    "rounded-md px-1.5 py-1 transition-colors",
    active === key
      ? "bg-neutral-100 font-semibold text-foreground dark:bg-neutral-800"
      : "text-muted hover:text-foreground",
  ].join(" ");

/**
 * 동종 SaaS(상단 고정 바 · 좌 로고 · 우 보조 내비)에 맞춘 공통 크롬.
 */
export function AppChrome({
  children,
  active,
}: {
  children: React.ReactNode;
  active?: AppChromeNav;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <header className="sticky top-0 z-20 h-[var(--header-height)] border-b border-[var(--list-border)] bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="font-display text-lg font-semibold tracking-tight text-foreground"
          >
            OpenGraze
          </Link>
          <nav
            className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-sm sm:gap-x-3"
            aria-label="주요 내비게이션"
          >
            <Link href="/" className={navLinkClass(active, "home")}>
              관측
            </Link>
            <Link
              href="/llms.txt"
              className="rounded-md px-1.5 py-1 text-muted transition-colors hover:text-foreground"
              target="_blank"
              rel="noopener noreferrer"
            >
              연동 요약
            </Link>
            <span className="hidden h-3 w-px shrink-0 bg-[var(--list-border)] sm:block" aria-hidden />
            <Link href="/dashboard" className={navLinkClass(active, "dashboard")}>
              대시보드
            </Link>
            <span className="hidden h-3 w-px shrink-0 bg-[var(--list-border)] sm:block" aria-hidden />
            <Link href="/login" className={navLinkClass(active, "login")}>
              로그인
            </Link>
            <Link href="/register" className={navLinkClass(active, "register")}>
              가입
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}

/**
 * 인증 폼용 — 좁은 카드 컬럼 + 패딩 일관화.
 */
export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-var(--header-height))] max-w-md flex-col justify-center px-4 py-10 sm:px-6">
      <div className="rounded-[var(--radius-xl)] border border-[var(--list-border)] bg-card p-8 shadow-[var(--shadow-card)]">
        {children}
      </div>
    </main>
  );
}

/**
 * 앱 영역(대시보드) — 가독 너비·세로 리듬 통일.
 */
export function AppMain({
  children,
  wide,
}: {
  children: React.ReactNode;
  /** 워크스페이스 상세 등 표·폼이 넓은 화면 */
  wide?: boolean;
}) {
  return (
    <main
      className={`mx-auto px-4 py-8 sm:px-6 sm:py-10 ${wide ? "max-w-5xl" : "max-w-2xl"}`}
    >
      {children}
    </main>
  );
}
