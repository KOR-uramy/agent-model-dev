"use client";

import {
  fmtUsd,
  PlatformRow,
  shortenPath,
  SHOW_LOGIN_LINKS,
  Stat,
} from "@/app/components/home-feed-support";
import { disclosureSummary } from "@/lib/ui-tokens";
import Link from "next/link";
import type { RalphEventsApiPayload, WorkspaceFeedEvent } from "ralph-workspace-sdk";

type ApiPayload = RalphEventsApiPayload;

export function HomeLandingColumn({
  data,
  events,
  timelineEmpty,
  sessionIdFilter,
  headlineMetric,
  summary,
  loading,
  onReload,
}: {
  data: ApiPayload | null;
  events: WorkspaceFeedEvent[];
  timelineEmpty: boolean;
  sessionIdFilter: string | null;
  headlineMetric: string;
  summary: ApiPayload["summary"] | undefined;
  loading: boolean;
  onReload: () => void;
}) {
  const s = summary;

  return (
    <>
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <div
          className="mb-8 h-[5.5rem] w-[5.5rem] overflow-hidden rounded-full bg-neutral-200 ring-1 ring-neutral-300 dark:bg-neutral-800 dark:ring-neutral-700"
          aria-hidden
        >
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-600 font-display text-2xl font-medium text-white dark:from-neutral-200 dark:to-neutral-400 dark:text-neutral-900">
            OG
          </div>
        </div>

        <h1 className="font-display text-[2.75rem] font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl">
          OpenGraze
        </h1>

        <p className="mt-3 max-w-[30rem] text-pretty text-sm leading-snug text-muted sm:text-[0.95rem]">
          챗 로그·APM 대시보드를 오가며 맞춰 보지 않고,{" "}
          <strong className="font-medium text-foreground">역할·추정 비용·제품 이벤트</strong>를 한 타임라인에서 재현합니다.
          수집·연동 계약은{" "}
          <Link
            href="/llms.txt"
            className="font-medium text-foreground underline underline-offset-2 hover:no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            /llms.txt
          </Link>
          로 공개해 두었고, 리포지토리의{" "}
          <code className="rounded bg-neutral-100 px-1 text-xs dark:bg-neutral-800">apps/open-graze/README.md</code> 한 블록으로
          핵심 플로를 재현할 수 있습니다.
        </p>

        <p className="mt-4 max-w-[26rem] text-pretty text-base font-medium leading-snug text-muted">
          {data?.workspace
            ? shortenPath(data.workspace, 44)
            : "운영·구매 담당자도 읽을 수 있게: 에이전트 루프와 제품이 같은 타임라인에 남습니다."}
        </p>

        <p className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-[2rem]">
          {headlineMetric}
        </p>

        {s?.peakEstimatedUsd != null && Number.isFinite(s.peakEstimatedUsd) ? (
          <p className="mt-2 text-sm text-muted">
            구간 기준 최대 추정 비용{" "}
            <span className="font-medium text-foreground">{fmtUsd(s.peakEstimatedUsd)}</span>
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted">몇 초마다 자동으로 새로고침됩니다</p>
        )}

        <p className="mx-auto mt-8 max-w-[22rem] text-pretty text-[1.05rem] italic leading-relaxed text-neutral-600 dark:text-neutral-400">
          반복되는 에이전트 실행과 실제 서비스 동작을 같은 줄에서 추적하고, 워크스페이스에서 수집과 결제까지 이어집니다.
        </p>

        <p className="mt-6 max-w-[28rem] text-pretty text-center text-xs leading-relaxed text-muted">
          <strong className="font-medium text-foreground">신뢰</strong> — 이메일·비밀번호(Credentials·JWT), 워크스페이스별 API 키, 수집 API 남용 완화.
          운영·구매 담당자에게는 위 공개 계약과{" "}
          <Link
            href="/llms.txt"
            className="font-medium text-foreground underline underline-offset-2 hover:no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            HTTP 수집 요약
          </Link>
          을 먼저 보여 주세요.
        </p>

        <p className="mt-8 flex flex-wrap items-center justify-center gap-2 text-[11px] text-muted">
          <span className="rounded-full border border-neutral-200 px-2.5 py-0.5 dark:border-neutral-700">몇 초마다 자동 갱신</span>
          <span className="rounded-full border border-neutral-200 px-2.5 py-0.5 dark:border-neutral-700">역할 배지·토큰·$ 추정</span>
          <span className="rounded-full border border-neutral-200 px-2.5 py-0.5 dark:border-neutral-700">공개 수집 스키마</span>
          <span className="rounded-full border border-neutral-200 px-2.5 py-0.5 dark:border-neutral-700">도그푸드 self-test</span>
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {SHOW_LOGIN_LINKS ? (
            <>
              <Link
                href="/register"
                className="rounded-full bg-cta px-8 py-3 text-sm font-semibold text-white transition hover:bg-cta-hover dark:text-neutral-900"
              >
                무료로 시작하기
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full border border-neutral-300 px-8 py-3 text-sm font-semibold text-foreground transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
              >
                대시보드 열기
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-neutral-300 px-8 py-3 text-sm font-semibold text-foreground transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
              >
                이미 계정이 있어요
              </Link>
            </>
          ) : (
            <Link
              href="/dashboard"
              className="rounded-full bg-cta px-8 py-3 text-sm font-semibold text-white transition hover:bg-cta-hover dark:text-neutral-900"
            >
              대시보드 열기
            </Link>
          )}
          <Link
            href="/llms.txt"
            className="rounded-full border border-dashed border-neutral-400 px-6 py-3 text-sm font-semibold text-muted transition hover:border-neutral-500 hover:text-foreground dark:border-neutral-600 dark:hover:border-neutral-500"
            target="_blank"
            rel="noopener noreferrer"
          >
            HTTP 수집 요약
          </Link>
        </div>

        <ul className="mx-auto mt-10 max-w-md space-y-2 text-left text-sm text-muted">
          <li className="flex gap-2">
            <span className="shrink-0 text-foreground" aria-hidden>
              ·
            </span>
            <span>
              <strong className="text-foreground">역할 구분</strong> — 기획·디자인·구현·테스트가 타임라인 배지로
              구분됩니다.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="shrink-0 text-foreground" aria-hidden>
              ·
            </span>
            <span>
              <strong className="text-foreground">재현 가능</strong> — 저장소에서{" "}
              <code className="rounded bg-neutral-100 px-1 text-xs dark:bg-neutral-800">platform:self-test</code>로
              수집 파이프를 바로 검증합니다.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="shrink-0 text-foreground" aria-hidden>
              ·
            </span>
            <span>
              <strong className="text-foreground">문서</strong> — 장문 가이드는 저장소{" "}
              <code className="rounded bg-neutral-100 px-1 text-xs dark:bg-neutral-800">docs/opengraze-llms-guide.md</code>
              , 요약은 위 <strong className="text-foreground">HTTP 수집 요약</strong> 링크(
              <code className="rounded bg-neutral-100 px-1 text-xs dark:bg-neutral-800">/llms.txt</code>)입니다.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="shrink-0 text-foreground" aria-hidden>
              ·
            </span>
            <span>
              <strong className="text-foreground">전환</strong> — 무료 가입 후 워크스페이스에서 키를 발급하고, 같은 화면에서 수집·과금 흐름을
              이어갑니다.
            </span>
          </li>
        </ul>
      </div>

      <ul className="mx-auto mt-16 space-y-0 border-y border-[var(--list-border)]">
        <PlatformRow
          emoji="📡"
          title="실시간 활동 피드"
          meta="에이전트 루프와 연결된 제품에서 올라온 이벤트를 이 화면에 모읍니다."
          rail={`${s?.rowCount ?? 0}건`}
        />
        <PlatformRow
          emoji="📥"
          title="로컬 로그 반영"
          meta="데스크톱·CI에 남은 로그를 서비스 타임라인으로 가져올 때 사용합니다."
          rail="연동"
        />
        <PlatformRow
          emoji="👥"
          title="워크스페이스 · 수집 API"
          meta="계정으로 들어가 키를 발급하고 수집 기록을 확인합니다."
          rail="이동"
          href="/dashboard"
        />
      </ul>

      <details className="mx-auto mt-10 text-center text-sm text-muted">
        <summary className={disclosureSummary}>
          <span className="underline decoration-neutral-300 underline-offset-[6px] dark:decoration-neutral-600">
            이 화면은 무엇을 보여 주나요?
          </span>
        </summary>
        <div className="mt-4 rounded-xl border border-[var(--list-border)] bg-card p-4 text-left text-sm leading-relaxed text-muted">
          <p>
            지금 보시는 목록은 OpenGraze에 저장된{" "}
            <strong className="text-foreground">활동 타임라인</strong>입니다. 아직 비어 있다면 로컬 환경에서 쌓인 로그가 서비스로 아직 들어오지 않은 상태일 수 있습니다.
          </p>
          <p className="mt-3">
            <strong className="text-foreground">대시보드</strong>에서는 워크스페이스별 API 키와 외부에서 보낸 수집
            이벤트를 따로 다룹니다.
          </p>
        </div>
      </details>

      {data?.error && events.length === 0 ? (
        <div
          className={
            timelineEmpty
              ? "mx-auto mt-8 rounded-xl border border-[var(--list-border)] bg-card px-5 py-4 text-left text-sm text-muted"
              : "mx-auto mt-8 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-left text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-100"
          }
        >
          <p className={timelineEmpty ? "font-semibold text-foreground" : "font-semibold"}>
            {timelineEmpty ? "표시할 활동이 아직 없어요" : "화면을 불러오지 못했습니다"}
          </p>
          {!timelineEmpty && data.error ? (
            <p className="mt-1 text-xs opacity-80">코드: {data.error}</p>
          ) : null}
          {data.hint ? <p className="mt-2 text-sm leading-relaxed opacity-90">{data.hint}</p> : null}
        </div>
      ) : data?.hint && !data?.error && events.length === 0 && sessionIdFilter ? (
        <div className="mx-auto mt-8 rounded-xl border border-[var(--list-border)] bg-card px-5 py-4 text-left text-sm text-muted">
          <p className="font-semibold text-foreground">이 세션에는 아직 표시할 행이 없어요</p>
          <p className="mt-2 text-sm leading-relaxed opacity-90">{data.hint}</p>
        </div>
      ) : null}

      <details className="mx-auto mt-12">
        <summary
          className={`${disclosureSummary} text-center text-sm font-medium text-muted`}
        >
          <span className="underline decoration-neutral-300 underline-offset-[6px] dark:decoration-neutral-600">
            요약 지표 보기
          </span>
        </summary>
        <div className="mx-auto mt-4 grid max-w-3xl gap-2 sm:grid-cols-2">
          <Stat label="추정 토큰 (피크)" value={s?.peakEstimatedTokens != null ? s.peakEstimatedTokens.toLocaleString() : "—"} />
          <Stat label="추정 비용 (피크)" value={fmtUsd(s?.peakEstimatedUsd)} />
          <Stat label="제품 이벤트 수" value={String(s?.applicationEventCount ?? 0)} sub="앱·서비스에서 보고된 건수" />
          <Stat
            label="누적 처리 시간"
            value={
              s?.totalApplicationDurationMs != null
                ? `${s.totalApplicationDurationMs.toLocaleString()} ms`
                : "—"
            }
          />
          <Stat
            label="누적 처리량"
            value={s?.totalApplicationUnits != null ? s.totalApplicationUnits.toLocaleString() : "—"}
            sub="보고된 단위 합계"
          />
          <Stat label="표시 중인 행" value={String(s?.rowCount ?? 0)} sub="현재 타임라인" />
        </div>
      </details>

      <div className="mx-auto mt-8 flex justify-center">
        <button
          type="button"
          onClick={() => void onReload()}
          className="text-sm text-muted underline-offset-4 hover:text-foreground hover:underline"
        >
          새로 고침
        </button>
        {loading ? <span className="ml-3 text-xs text-muted">불러오는 중…</span> : null}
      </div>
    </>
  );
}
