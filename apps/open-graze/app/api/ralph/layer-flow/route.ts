import { readdir, readFile } from "fs/promises";
import path from "path";
import { loadTimelineFromDb } from "@/lib/timeline-feed";
import { NextResponse } from "next/server";

type LayerDoc = {
  order: number;
  key: string;
  title: string;
  content: string;
  checklist: { text: string; checked: boolean }[];
  thread: "core" | "presentation" | "ops";
};

function repoRootFromCwd() {
  return path.resolve(process.cwd(), "..", "..");
}

async function readLayerDocs(): Promise<LayerDoc[]> {
  const dir = path.join(process.cwd(), "content", "ralph-layers");
  const files = (await readdir(dir))
    .filter((name) => name.endsWith(".md"))
    .sort((a, b) => a.localeCompare(b));

  const out: LayerDoc[] = [];
  for (const file of files) {
    const m = file.match(/^(\d+)_([a-z0-9_]+)\.md$/i);
    if (!m) continue;
    const order = Number.parseInt(m[1] ?? "0", 10);
    const key = m[2] ?? file.replace(".md", "");
    const full = path.join(dir, file);
    const content = await readFile(full, "utf-8");
    const checklist = content
      .split("\n")
      .map((line) => line.trim())
      .map((line) => {
        const m = line.match(/^[-*]\s+\[( |x|X)\]\s+(.+)$/);
        if (!m) return null;
        return { checked: m[1].toLowerCase() === "x", text: m[2].trim() };
      })
      .filter((x): x is { text: string; checked: boolean } => x != null);
    const titleLine = content.split("\n").find((line) => line.startsWith("# "));
    const title = titleLine ? titleLine.replace(/^#\s+/, "").trim() : key;
    out.push({
      order,
      key,
      title,
      content,
      checklist,
      thread: order <= 3 ? "core" : order <= 7 ? "presentation" : "ops",
    });
  }
  return out.sort((a, b) => a.order - b.order);
}

async function readFirstUncheckedNeed(): Promise<string> {
  const taskPath = path.join(repoRootFromCwd(), "RALPH_TASK.md");
  const text = await readFile(taskPath, "utf-8");
  const lines = text.split("\n");
  const pending = lines.find((line) =>
    /^[\s]*([-*]|[0-9]+\.)\s+\[ \]\s+/.test(line),
  );
  if (!pending) return "현재 미완 Need가 없습니다(체크리스트 완료).";
  return pending.replace(/^[\s]*([-*]|[0-9]+\.)\s+\[ \]\s+/, "").trim();
}

async function readLatestProgressAction(): Promise<string> {
  const p = path.join(repoRootFromCwd(), ".ralph", "progress.md");
  const text = await readFile(p, "utf-8");
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#") && !line.startsWith(">"));
  return lines.at(-1) ?? "최근 진행 메모가 없습니다.";
}

async function readCapabilitySummary(): Promise<string> {
  const p = path.join(repoRootFromCwd(), ".codex", "ralph-scripts", "ralph-common.sh");
  const text = await readFile(p, "utf-8");
  const roleCycle = text.includes("% 3")
    ? "역할 사이클: 3단계(기획→구현→검증)"
    : "역할 사이클: 확인 필요";
  const autoExpand = text.includes("RALPH_AUTO_EXPAND_ON_COMPLETE")
    ? "완료 후 자동 확장: 활성 코드 존재"
    : "완료 후 자동 확장: 비활성/미구현";
  return `${roleCycle} / ${autoExpand}`;
}

async function readLatestErrorLine(): Promise<string | null> {
  try {
    const p = path.join(repoRootFromCwd(), ".ralph", "errors.log");
    const text = await readFile(p, "utf-8");
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("#") && !l.startsWith(">"));
    return lines.at(-1) ?? null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const [layers, payload, need, action, capability, latestError] = await Promise.all([
      readLayerDocs(),
      loadTimelineFromDb(25, null, null),
      readFirstUncheckedNeed(),
      readLatestProgressAction(),
      readCapabilitySummary(),
      readLatestErrorLine(),
    ]);

    const usageEvents = payload.events.slice(-8).map((e) => {
      const ts = e.ts ?? "";
      const source = e.source ?? "unknown";
      const kind = e.kind ?? "unknown";
      return `${ts} | ${source} | ${kind}`;
    });

    const latest = payload.events.at(-1);
    const presentationBuilder =
      usageEvents.length === 0
        ? "usageData가 비어 있어 empty-state UI를 우선한다."
        : "최근 usageData를 기반으로 상태 배지와 latest event 카드를 우선 노출한다.";
    const presentationData = {
      status: usageEvents.length === 0 ? "empty" : "active",
      usageCount: payload.events.length,
      latestKind: latest?.kind ?? "none",
      latestSource: latest?.source ?? "none",
      recommendation:
        usageEvents.length === 0
          ? "이벤트를 1건 이상 수집해 루프 관측을 시작하세요."
          : "최근 이벤트를 기준으로 다음 구현/검증 액션을 선택하세요.",
    };
    const ui =
      presentationData.status === "empty"
        ? "빈 상태 UI + 수집 시작 가이드"
        : "루프 상태 카드 + 최근 이벤트 + 다음 액션 제안";

    const layerTriggers = layers.map((layer, idx) => {
      const prev = layers[idx - 1];
      const triggers = layer.checklist.filter((c) => !c.checked).map((c) => c.text);
      const triggerSource =
        idx === 0
          ? "첫 단계(Need)는 루프 시작 입력 자체가 트리거"
          : `전단계(${prev?.title ?? "unknown"})가 이 md에 남긴 미완 체크리스트`;
      return {
        key: layer.key,
        title: layer.title,
        triggerSource,
        triggerCount: triggers.length,
        triggers,
      };
    });

    const coreLayers = layers.filter((l) => l.thread === "core");
    const presentationLayers = layers.filter((l) => l.thread === "presentation");
    const opsLayers = layers.filter((l) => l.thread === "ops");
    const corePending = coreLayers.flatMap((l) => l.checklist).filter((c) => !c.checked).length;
    const presentationPending = presentationLayers
      .flatMap((l) => l.checklist)
      .filter((c) => !c.checked).length;
    const opsPending = opsLayers.flatMap((l) => l.checklist).filter((c) => !c.checked).length;

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      layers,
      layerTriggers,
      orchestration: {
        mode: "triple-thread",
        rationale:
          "1~3(core) 실행, 4~7(presentation) 표현, 8(ops) 배포/디버깅을 분리해 병렬 운영",
        coreThread: {
          layers: coreLayers.map((l) => l.key),
          pendingChecklist: corePending,
          policy: "strict-sequence",
        },
        presentationThread: {
          layers: presentationLayers.map((l) => l.key),
          pendingChecklist: presentationPending,
          policy: "parallel-followup",
        },
        opsThread: {
          layers: opsLayers.map((l) => l.key),
          pendingChecklist: opsPending,
          policy: "release-and-debug-gate",
        },
      },
      flow: {
        need,
        action,
        capabilityLogic: capability,
        usageData: usageEvents,
        presentationBuilder,
        presentationData,
        ui,
        releaseDebug:
          latestError == null
            ? "현재 활성 에러 신호 없음. 빌드/배포 체크리스트를 진행하세요."
            : `최근 에러 로그 감지: ${latestError}`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json(
      { error: "layer_flow_failed", message },
      { status: 500 },
    );
  }
}

