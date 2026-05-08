"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type LayerDoc = {
  order: number;
  key: string;
  title: string;
  content: string;
  checklist: { text: string; checked: boolean }[];
  thread: "core" | "presentation" | "ops";
};

type FlowPayload = {
  generatedAt: string;
  layers: LayerDoc[];
  layerTriggers: {
    key: string;
    title: string;
    triggerSource: string;
    triggerCount: number;
    triggers: string[];
  }[];
  orchestration?: {
    mode: string;
    rationale: string;
    coreThread: { layers: string[]; pendingChecklist: number; policy: string };
    presentationThread: { layers: string[]; pendingChecklist: number; policy: string };
    opsThread?: { layers: string[]; pendingChecklist: number; policy: string };
  };
  flow: {
    need: string;
    needSource?: "app" | "layer_doc" | "ralph_task" | "empty";
    action: string;
    capabilityLogic: string;
    usageData: {
      ts: string;
      source: string;
      kind: string;
      sessionId: string;
    }[];
    presentationBuilder: string;
    presentationData: {
      status: "empty" | "healthy" | "warning";
      metrics: { usageCount: number; recentSources: string[] };
      latestEvent: {
        ts: string;
        kind: string;
        source: string;
        sessionId: string;
      } | null;
      highlightedText: string;
      recommendation: string;
      updatedAt: string;
      completeness: "complete";
    };
    ui: string;
    releaseDebug?: string;
  };
};

export function RalphLoopShowcase() {
  const [payload, setPayload] = useState<FlowPayload | null>(null);
  /** 수동 새로고침(버튼) 전용 — SSE와 분리해 로딩이 끝없이 걸리지 않게 함 */
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needDraft, setNeedDraft] = useState("");
  const [needSaving, setNeedSaving] = useState(false);
  const [needFeedback, setNeedFeedback] = useState<string | null>(null);
  const fetchInFlight = useRef(false);
  const flow = payload?.flow;
  const layers = payload?.layers ?? [];
  const coreLayers = layers.filter((l) => l.thread === "core");
  const presentationLayers = layers.filter((l) => l.thread === "presentation");
  const opsLayers = layers.filter((l) => l.thread === "ops");
  const layerTriggers = payload?.layerTriggers ?? [];
  const usageCount = flow?.usageData.length ?? 0;
  const latestUsage =
    usageCount > 0
      ? flow?.usageData[usageCount - 1]
      : null;

  const summary = useMemo(() => {
    if (!flow?.ui) return "실데이터를 불러오면 현재 UI 결론이 표시됩니다.";
    return `최근 UI 결론: ${flow.ui}`;
  }, [flow?.ui]);

  const reload = useCallback(async () => {
    if (fetchInFlight.current) return;
    fetchInFlight.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ralph/layer-flow", { cache: "no-store" });
      const text = await res.text();
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 240)}`);
      }
      const j = JSON.parse(text) as FlowPayload;
      setPayload(j);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      fetchInFlight.current = false;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/ralph/app-need", { cache: "no-store" });
        if (!res.ok) return;
        const j = (await res.json()) as { need: string | null };
        if (typeof j.need === "string" && j.need.length > 0) {
          setNeedDraft(j.need);
        }
      } catch {
        // 무시: 로컬 전용 API
      }
    })();
  }, []);

  useEffect(() => {
    const source = new EventSource("/api/ralph/layer-flow/stream");

    source.addEventListener("layer-flow", (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data) as FlowPayload;
        setPayload(data);
        setError(null);
        setIsLoading(false);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(`SSE 파싱 실패: ${msg}`);
      }
    });

    return () => source.close();
  }, []);

  const presentationData = flow?.presentationData;
  const usageDataBody =
    usageCount === 0
      ? "기록 없음"
      : flow?.usageData
          .slice(-3)
          .map((item) => `${item.ts} | ${item.source} | ${item.kind} | ${item.sessionId}`)
          .join("\n") ?? "기록 없음";
  const statusLabel =
    presentationData?.status === "empty"
      ? "EMPTY"
      : presentationData?.status === "warning"
        ? "WARNING"
        : "HEALTHY";

  const needSourceLabel = (() => {
    const s = flow?.needSource;
    if (s === "app") return "출처: 앱 입력 (.ralph/app_need.txt) — RALPH_TASK.md보다 우선";
    if (s === "layer_doc") return "출처: 01_need.md 미완 체크리스트";
    if (s === "ralph_task") return "출처: RALPH_TASK.md 첫 미완 [ ]";
    if (s === "empty") return "출처: 없음 — 아래에서 니즈를 입력하거나 과제 파일을 채우세요";
    return null;
  })();

  const saveAppNeed = useCallback(async () => {
    setNeedSaving(true);
    setNeedFeedback(null);
    try {
      const res = await fetch("/api/ralph/app-need", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ need: needDraft }),
      });
      const text = await res.text();
      if (!res.ok) {
        throw new Error(text.slice(0, 240));
      }
      setNeedFeedback("저장했습니다. 잠시 후 스트림이 갱신됩니다.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setNeedFeedback(`저장 실패: ${msg}`);
    } finally {
      setNeedSaving(false);
    }
  }, [needDraft]);

  const clearAppNeed = useCallback(async () => {
    setNeedSaving(true);
    setNeedFeedback(null);
    try {
      const res = await fetch("/api/ralph/app-need", { method: "DELETE" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text.slice(0, 240));
      }
      setNeedDraft("");
      setNeedFeedback("앱 니즈를 지웠습니다. RALPH_TASK.md 기준으로 다시 표시됩니다.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setNeedFeedback(`초기화 실패: ${msg}`);
    } finally {
      setNeedSaving(false);
    }
  }, []);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <header className="rounded-2xl border border-[var(--list-border)] bg-card p-6">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">Ralph Loop Visualizer</p>
        <h1 className="mt-2 text-2xl font-semibold">Need → Action → Capability+Logic → Usage → Presentation → UI</h1>
        <p className="mt-2 text-sm text-muted">{summary}</p>
        <p className="mt-1 text-xs text-muted">
          데이터 갱신: {payload?.generatedAt ? new Date(payload.generatedAt).toLocaleString() : "미수집"}
        </p>
      </header>

      <section className="rounded-2xl border border-[var(--list-border)] bg-card p-5">
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            className="rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background disabled:opacity-60"
            onClick={() => void reload()}
            disabled={isLoading}
          >
            {isLoading ? "불러오는 중..." : "실데이터 새로고침"}
          </button>
        </div>
        {error ? <p className="mt-3 text-xs text-red-500">{error}</p> : null}
      </section>

      <section className="rounded-2xl border border-[var(--list-border)] bg-card p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">니즈 입력 (앱 → 워크스페이스)</p>
        <p className="mt-2 text-xs text-muted leading-relaxed">
          저장하면 레포 루트 <code className="rounded bg-muted px-1 py-0.5 text-[11px]">.ralph/app_need.txt</code>에
          기록되고, 위 플로우 카드의 Need는 이 내용을 RALPH_TASK.md보다 우선해 표시합니다.
        </p>
        <textarea
          className="mt-3 min-h-[100px] w-full resize-y rounded-xl border border-[var(--list-border)] bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted"
          placeholder="지금 루프에 넣고 싶은 Need를 한 줄 이상 입력하세요."
          value={needDraft}
          onChange={(e) => setNeedDraft(e.target.value)}
          disabled={needSaving}
          maxLength={8000}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background disabled:opacity-60"
            onClick={() => void saveAppNeed()}
            disabled={needSaving}
          >
            {needSaving ? "저장 중…" : "니즈 저장"}
          </button>
          <button
            type="button"
            className="rounded-lg border border-[var(--list-border)] px-3 py-2 text-sm font-medium disabled:opacity-60"
            onClick={() => void clearAppNeed()}
            disabled={needSaving}
          >
            앱 니즈 지우기
          </button>
        </div>
        {needFeedback ? <p className="mt-2 text-xs text-muted">{needFeedback}</p> : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <StageCard
          title="1) Need"
          subtitle={needSourceLabel}
          body={flow?.need ?? "대기 중..."}
        />
        <StageCard title="2) Action" body={flow?.action ?? "대기 중..."} />
        <StageCard
          title="3) Capability + Business Logic"
          body={flow?.capabilityLogic ?? "대기 중..."}
        />
        <StageCard
          title="4) Usage Data"
          body={`${usageCount ? `${usageCount}건 누적` : "기록 없음"}\n${usageDataBody}`}
        />
        <StageCard
          title="5) Presentation Builder"
          body={flow?.presentationBuilder ?? "대기 중..."}
        />
        <StageCard
          title="6) Presentation Data"
          body={
            presentationData
              ? [
                  `status: ${presentationData.status}`,
                  `usageCount: ${presentationData.metrics.usageCount}`,
                  `recentSources: ${presentationData.metrics.recentSources.join(", ") || "-"}`,
                  `highlightedText: ${presentationData.highlightedText}`,
                  `recommendation: ${presentationData.recommendation}`,
                ].join("\n")
              : "데이터 없음"
          }
        />
      </section>

      <section className="rounded-2xl border border-[var(--list-border)] bg-card p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">7) UI</p>
        <div className="mt-2 inline-flex items-center rounded-full border border-[var(--list-border)] px-2 py-1 text-[11px] font-medium">
          상태 배지: {statusLabel}
        </div>
        <p className="mt-2 text-sm leading-relaxed">{flow?.ui || "아직 UI 결과가 없습니다."}</p>
        <p className="mt-2 text-xs text-muted">
          {presentationData?.latestEvent
            ? `최신 이벤트: ${presentationData.latestEvent.ts} | ${presentationData.latestEvent.source} | ${presentationData.latestEvent.kind}`
            : `최신 이벤트: ${latestUsage ? `${latestUsage.ts} | ${latestUsage.source} | ${latestUsage.kind}` : "없음"}`}
        </p>
        <p className="mt-2 text-xs text-muted">
          추천 동선: {presentationData?.recommendation ?? "아직 추천이 없습니다."}
        </p>
        <p className="mt-4 text-xs text-muted">UI는 Need 수행을 지원하고, 다음 Need로 반복됩니다.</p>
      </section>
      <section className="rounded-2xl border border-[var(--list-border)] bg-card p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">8) Release / Deploy / Debug</p>
        <p className="mt-2 text-sm leading-relaxed">
          {flow?.releaseDebug ?? "운영 레이어 데이터가 아직 없습니다."}
        </p>
        <p className="mt-3 text-xs text-muted">
          최종 빌드/배포 게이트와 에러 디버깅 책임을 갖는 별도 수명주기 레이어입니다.
        </p>
      </section>

      <section className="rounded-2xl border border-[var(--list-border)] bg-card p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">Orchestration</p>
        <p className="mt-2 text-sm">
          {payload?.orchestration?.rationale ??
            "병렬 운영 모델 정보가 아직 없습니다."}
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <article className="rounded-xl border border-[var(--list-border)] p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-muted">Core Thread (1~3)</p>
            <p className="mt-1 text-sm">
              policy: {payload?.orchestration?.coreThread.policy ?? "-"} / pending:{" "}
              {payload?.orchestration?.coreThread.pendingChecklist ?? 0}
            </p>
            <p className="mt-1 text-xs text-muted">
              {payload?.orchestration?.coreThread.layers.join(" → ") ?? "-"}
            </p>
          </article>
          <article className="rounded-xl border border-[var(--list-border)] p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-muted">
              Presentation Thread (4~7)
            </p>
            <p className="mt-1 text-sm">
              policy: {payload?.orchestration?.presentationThread.policy ?? "-"} / pending:{" "}
              {payload?.orchestration?.presentationThread.pendingChecklist ?? 0}
            </p>
            <p className="mt-1 text-xs text-muted">
              {payload?.orchestration?.presentationThread.layers.join(" → ") ?? "-"}
            </p>
          </article>
          <article className="rounded-xl border border-[var(--list-border)] p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-muted">Ops Thread (8)</p>
            <p className="mt-1 text-sm">
              policy: {payload?.orchestration?.opsThread?.policy ?? "-"} / pending:{" "}
              {payload?.orchestration?.opsThread?.pendingChecklist ?? 0}
            </p>
            <p className="mt-1 text-xs text-muted">
              {payload?.orchestration?.opsThread?.layers.join(" → ") ?? "-"}
            </p>
          </article>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--list-border)] bg-card p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">Layer Markdown (ordered)</p>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <div className="space-y-3">
            <p className="text-xs font-semibold text-foreground">Core Thread</p>
            {coreLayers.map((layer) => (
              <article key={layer.key} className="rounded-xl border border-[var(--list-border)] p-3">
                <p className="text-sm font-semibold">
                  {layer.order}. {layer.title}
                </p>
                <pre className="mt-2 whitespace-pre-wrap text-xs text-muted">{layer.content}</pre>
                <div className="mt-3 rounded-lg border border-[var(--list-border)] p-2">
                  <p className="text-[11px] font-semibold text-foreground">Checklist</p>
                  {layer.checklist.length === 0 ? (
                    <p className="mt-1 text-[11px] text-muted">체크리스트 없음</p>
                  ) : (
                    <ul className="mt-1 space-y-1 text-[11px] text-muted">
                      {layer.checklist.map((c, idx) => (
                        <li key={`${layer.key}-${idx}`}>
                          {c.checked ? "[x]" : "[ ]"} {c.text}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            ))}
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold text-foreground">Ops Thread</p>
            {opsLayers.map((layer) => (
              <article key={layer.key} className="rounded-xl border border-[var(--list-border)] p-3">
                <p className="text-sm font-semibold">
                  {layer.order}. {layer.title}
                </p>
                <pre className="mt-2 whitespace-pre-wrap text-xs text-muted">{layer.content}</pre>
                <div className="mt-3 rounded-lg border border-[var(--list-border)] p-2">
                  <p className="text-[11px] font-semibold text-foreground">Checklist</p>
                  {layer.checklist.length === 0 ? (
                    <p className="mt-1 text-[11px] text-muted">체크리스트 없음</p>
                  ) : (
                    <ul className="mt-1 space-y-1 text-[11px] text-muted">
                      {layer.checklist.map((c, idx) => (
                        <li key={`${layer.key}-${idx}`}>
                          {c.checked ? "[x]" : "[ ]"} {c.text}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            ))}
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold text-foreground">Presentation Thread</p>
            {presentationLayers.map((layer) => (
              <article key={layer.key} className="rounded-xl border border-[var(--list-border)] p-3">
                <p className="text-sm font-semibold">
                  {layer.order}. {layer.title}
                </p>
                <pre className="mt-2 whitespace-pre-wrap text-xs text-muted">{layer.content}</pre>
                <div className="mt-3 rounded-lg border border-[var(--list-border)] p-2">
                  <p className="text-[11px] font-semibold text-foreground">Checklist</p>
                  {layer.checklist.length === 0 ? (
                    <p className="mt-1 text-[11px] text-muted">체크리스트 없음</p>
                  ) : (
                    <ul className="mt-1 space-y-1 text-[11px] text-muted">
                      {layer.checklist.map((c, idx) => (
                        <li key={`${layer.key}-${idx}`}>
                          {c.checked ? "[x]" : "[ ]"} {c.text}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            ))}
          </div>
          {layers.length === 0 ? (
            <article className="rounded-xl border border-[var(--list-border)] p-3">
              <p className="text-xs text-muted">레이어 md 파일을 읽지 못했습니다.</p>
            </article>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--list-border)] bg-card p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">Stage Triggers</p>
        <p className="mt-2 text-xs text-muted">
          각 단계의 작업 트리거는 직전 단계 md의 미완 체크리스트를 기준으로 계산합니다.
        </p>
        <div className="mt-3 grid gap-3">
          {layerTriggers.map((t) => (
            <article key={t.key} className="rounded-xl border border-[var(--list-border)] p-3">
              <p className="text-sm font-semibold">{t.title}</p>
              <p className="mt-1 text-xs text-muted">{t.triggerSource}</p>
              <p className="mt-1 text-xs text-foreground">미완 트리거: {t.triggerCount}개</p>
              {t.triggers.length > 0 ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted">
                  {t.triggers.map((item, idx) => (
                    <li key={`${t.key}-trigger-${idx}`}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-muted">현재 미완 트리거가 없습니다.</p>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function StageCard({
  title,
  subtitle,
  body,
}: {
  title: string;
  subtitle?: string | null;
  body: string;
}) {
  return (
    <article className="rounded-2xl border border-[var(--list-border)] bg-card p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-muted">{title}</p>
      {subtitle ? <p className="mt-1 text-[11px] leading-snug text-muted">{subtitle}</p> : null}
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{body || "대기 중..."}</p>
    </article>
  );
}

