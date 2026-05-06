"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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
    action: string;
    capabilityLogic: string;
    usageData: string[];
    presentationBuilder: string;
    presentationData: Record<string, unknown>;
    ui: string;
    releaseDebug?: string;
  };
};

export function RalphLoopShowcase() {
  const [payload, setPayload] = useState<FlowPayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const flow = payload?.flow;
  const layers = payload?.layers ?? [];
  const coreLayers = layers.filter((l) => l.thread === "core");
  const presentationLayers = layers.filter((l) => l.thread === "presentation");
  const opsLayers = layers.filter((l) => l.thread === "ops");
  const layerTriggers = payload?.layerTriggers ?? [];
  const usageCount = flow?.usageData.length ?? 0;
  const latestUsage =
    usageCount > 0 ? flow?.usageData[usageCount - 1] ?? "없음" : "없음";

  const summary = useMemo(() => {
    if (!flow?.ui) return "실데이터를 불러오면 현재 UI 결론이 표시됩니다.";
    return `최근 UI 결론: ${flow.ui}`;
  }, [flow?.ui]);

  const reload = useCallback(async () => {
    if (isLoading) return;
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
      setIsLoading(false);
    }
  }, [isLoading]);

  useEffect(() => {
    void reload();
    const id = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void reload();
    }, 10000);
    return () => window.clearInterval(id);
  }, [reload]);

  const presentationDataJson = flow?.presentationData
    ? JSON.stringify(flow.presentationData, null, 2)
    : "데이터 없음";

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

      <section className="grid gap-4 md:grid-cols-2">
        <StageCard title="1) Need" body={flow?.need ?? "대기 중..."} />
        <StageCard title="2) Action" body={flow?.action ?? "대기 중..."} />
        <StageCard
          title="3) Capability + Business Logic"
          body={flow?.capabilityLogic ?? "대기 중..."}
        />
        <StageCard
          title="4) Usage Data"
          body={`${usageCount ? `${usageCount}건 누적` : "기록 없음"}\n최근: ${latestUsage}`}
        />
        <StageCard
          title="5) Presentation Builder"
          body={flow?.presentationBuilder ?? "대기 중..."}
        />
        <StageCard title="6) Presentation Data" body={presentationDataJson} />
      </section>

      <section className="rounded-2xl border border-[var(--list-border)] bg-card p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">7) UI</p>
        <p className="mt-2 text-sm leading-relaxed">{flow?.ui || "아직 UI 결과가 없습니다."}</p>
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
          각 단계의 작업 트리거는 해당 단계 md의 미완 체크리스트이며, 전단계가 이를 작성한다는 규칙을 따릅니다.
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

function StageCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-2xl border border-[var(--list-border)] bg-card p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-muted">{title}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{body || "대기 중..."}</p>
    </article>
  );
}

