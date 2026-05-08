import { existsSync } from "fs";
import { readdir, readFile } from "fs/promises";
import path from "path";
import { readAppNeed } from "@/lib/ralph-app-need";
import { loadTimelineFromDb } from "@/lib/timeline-feed";

export type LayerDoc = {
  order: number;
  key: string;
  title: string;
  content: string;
  checklist: { text: string; checked: boolean }[];
  thread: "core" | "presentation" | "ops";
};

/** core(1~3) Action 카드 우선순위 노출 한도 */
export const CORE_ACTION_ITEMS_MAX = 3;

/** Capability 본문이 03 미완 항목 없을 때 보여줄 안내 문구 */
export const CAPABILITY_PLACEHOLDER =
  "03_capability_business_logic.md에 미완 체크리스트를 추가하세요.";

/** Action 본문이 02 미완 항목 없을 때 보여줄 안내 문구 */
export const ACTION_PLACEHOLDER = "02_action.md에 미완 체크리스트를 추가하세요.";

export type CoreIntegrityField = "need" | "action" | "capabilityLogic";

export type CoreIntegrity = {
  ok: boolean;
  /** 비어 있거나 placeholder만 있는 필드 목록 */
  issues: CoreIntegrityField[];
  /** 각 필드가 실데이터(placeholder 아님)로 채워졌는지 */
  fields: Record<CoreIntegrityField, boolean>;
};

export type CapabilityLogicStructured = {
  /** 03 미완 체크리스트 첫 항목(우선 규칙) */
  policy: string;
  /** 사이클·자동확장 등 운영 제약 요약 */
  constraints: string;
  /** 활성 에러 우선 복구 정책 등 실패 처리 요약 */
  errorHandling: string;
};

export type LayerFlowPayload = {
  generatedAt: string;
  layers: LayerDoc[];
  layerTriggers: {
    key: string;
    title: string;
    triggerSource: string;
    triggerCount: number;
    triggers: string[];
  }[];
  orchestration: {
    mode: string;
    rationale: string;
    coreThread: { layers: string[]; pendingChecklist: number; policy: string };
    presentationThread: { layers: string[]; pendingChecklist: number; policy: string };
    opsThread: { layers: string[]; pendingChecklist: number; policy: string };
  };
  flow: {
    need: string;
    /** `app`: `.ralph/app_need.txt` · `layer_doc`: 01_need.md 미완 체크 · `ralph_task`: RALPH_TASK.md 첫 미완 항목 · `empty`: 모두 없음 */
    needSource: "app" | "layer_doc" | "ralph_task" | "empty";
    action: string;
    /** 02_action.md 미완 체크리스트 상위 1~3개(우선순위 = 작성 순서). `action`은 `actionItems[0]`과 동일 */
    actionItems: string[];
    capabilityLogic: string;
    /** capabilityLogic을 정책·제약·실패처리 3축으로 구조화한 본문 */
    capabilityLogicStructured: CapabilityLogicStructured;
    /** core(1~3) 요약이 빈 값 없이 채워졌는지에 대한 운영 검증 결과 */
    coreIntegrity: CoreIntegrity;
    usageData: {
      ts: string;
      source: string;
      kind: string;
      sessionId: string;
    }[];
    presentationBuilder: string;
    presentationData: {
      status: "empty" | "healthy" | "warning";
      metrics: {
        usageCount: number;
        recentSources: string[];
      };
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
    releaseDebug: string;
  };
};

function resolveWorkspaceRoot() {
  const envRoot = process.env.RALPH_WORKSPACE_ROOT?.trim();
  if (envRoot) {
    return path.resolve(envRoot);
  }

  let current = process.cwd();
  while (true) {
    const taskPath = path.join(current, "RALPH_TASK.md");
    if (existsSync(taskPath)) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  return path.resolve(process.cwd(), "..", "..");
}

async function readLayerDocs(): Promise<LayerDoc[]> {
  const localDir = path.join(process.cwd(), "content", "ralph-layers");
  const workspaceDir = path.join(
    resolveWorkspaceRoot(),
    "apps",
    "open-graze",
    "content",
    "ralph-layers",
  );
  const dir = existsSync(localDir) ? localDir : workspaceDir;
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
        const checkbox = line.match(/^[-*]\s+\[( |x|X)\]\s+(.+)$/);
        if (!checkbox) return null;
        return { checked: checkbox[1].toLowerCase() === "x", text: checkbox[2].trim() };
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

function firstUncheckedItem(layer: LayerDoc | undefined): string | null {
  if (!layer) return null;
  const pending = layer.checklist.find((item) => !item.checked);
  return pending?.text ?? null;
}

async function resolveDisplayedNeed(
  layers: LayerDoc[],
): Promise<{ need: string; needSource: "app" | "layer_doc" | "ralph_task" | "empty" }> {
  const appNeed = await readAppNeed();
  if (appNeed) {
    return { need: appNeed, needSource: "app" };
  }
  const needLayer = layers.find((layer) => layer.order === 1);
  const layerNeed = firstUncheckedItem(needLayer);
  if (layerNeed) {
    return { need: layerNeed, needSource: "layer_doc" };
  }
  const taskPath = path.join(resolveWorkspaceRoot(), "RALPH_TASK.md");
  const text = await readFile(taskPath, "utf-8");
  const pending = text
    .split("\n")
    .find((line) => /^[\s]*([-*]|[0-9]+\.)\s+\[ \]\s+/.test(line));
  if (!pending) {
    return {
      need: "앱에서 니즈를 입력하거나, RALPH_TASK.md에 미완 [ ] 항목을 추가하세요.",
      needSource: "empty",
    };
  }
  return {
    need: pending.replace(/^[\s]*([-*]|[0-9]+\.)\s+\[ \]\s+/, "").trim(),
    needSource: "ralph_task",
  };
}

function uncheckedItems(layer: LayerDoc | undefined, max: number): string[] {
  if (!layer) return [];
  return layer.checklist
    .filter((item) => !item.checked)
    .slice(0, Math.max(0, max))
    .map((item) => item.text);
}

function resolveActionItemsFromLayer(layers: LayerDoc[]): string[] {
  const actionLayer = layers.find((layer) => layer.order === 2);
  return uncheckedItems(actionLayer, CORE_ACTION_ITEMS_MAX);
}

type CapabilityComputed = {
  summary: string;
  structured: CapabilityLogicStructured;
};

function buildErrorHandlingPolicy(latestError: string | null): string {
  if (!latestError) {
    return "활성 에러 없음: 일반 체크리스트를 진행하되, 새 오류 발생 시 즉시 복구 우선으로 전환";
  }
  return `활성 에러 감지: 일반 체크리스트보다 복구를 우선 (${latestError})`;
}

async function readCapabilitySummary(
  layers: LayerDoc[],
  latestError: string | null,
): Promise<CapabilityComputed> {
  const commonPath = path.join(resolveWorkspaceRoot(), ".codex", "ralph-scripts", "ralph-common.sh");
  const text = await readFile(commonPath, "utf-8");
  const roleCycle = text.includes("% 3")
    ? "역할 사이클: 3단계(기획→구현→검증)"
    : "역할 사이클: 확인 필요";
  const autoExpand = text.includes("RALPH_AUTO_EXPAND_ON_COMPLETE")
    ? "완료 후 자동 확장: 활성 코드 존재"
    : "완료 후 자동 확장: 비활성/미구현";
  const capabilityLayer = layers.find((layer) => layer.order === 3);
  const pendingCapability = firstUncheckedItem(capabilityLayer);
  const policy = pendingCapability
    ? `우선 규칙: ${pendingCapability}`
    : CAPABILITY_PLACEHOLDER;
  const constraints = `${roleCycle} / ${autoExpand}`;
  const errorHandling = buildErrorHandlingPolicy(latestError);
  return {
    summary: `${policy} / ${constraints}`,
    structured: { policy, constraints, errorHandling },
  };
}

/**
 * core(1~3) 요약이 빈 값/placeholder 없이 채워졌는지 운영 검증.
 * UI/SSE 소비자가 `coreIntegrity.ok === false`일 때 1~3 레이어 md 보강을 즉시 알 수 있다.
 */
export function computeCoreIntegrity(
  need: string,
  action: string,
  capabilityLogic: string,
): CoreIntegrity {
  const isMeaningful = (value: string, placeholder?: string) => {
    const trimmed = value.trim();
    if (trimmed.length === 0) return false;
    if (placeholder && trimmed.startsWith(placeholder)) return false;
    return true;
  };
  const fields: Record<CoreIntegrityField, boolean> = {
    need: isMeaningful(need),
    action: isMeaningful(action, ACTION_PLACEHOLDER),
    capabilityLogic: isMeaningful(capabilityLogic, CAPABILITY_PLACEHOLDER),
  };
  const issues: CoreIntegrityField[] = (
    ["need", "action", "capabilityLogic"] as CoreIntegrityField[]
  ).filter((key) => !fields[key]);
  return { ok: issues.length === 0, issues, fields };
}

async function readLatestErrorLine(): Promise<string | null> {
  try {
    const errorsPath = path.join(resolveWorkspaceRoot(), ".ralph", "errors.log");
    const text = await readFile(errorsPath, "utf-8");
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#") && !line.startsWith(">"));
    return lines.at(-1) ?? null;
  } catch {
    return null;
  }
}

export async function buildLayerFlowPayload(): Promise<LayerFlowPayload> {
  const layers = await readLayerDocs();
  const [payload, needBlock, latestError] = await Promise.all([
    loadTimelineFromDb(25, null, null),
    resolveDisplayedNeed(layers),
    readLatestErrorLine(),
  ]);
  const capability = await readCapabilitySummary(layers, latestError);
  const actionItems = resolveActionItemsFromLayer(layers);
  const action = actionItems[0] ?? ACTION_PLACEHOLDER;
  const { need, needSource } = needBlock;
  const coreIntegrity = computeCoreIntegrity(need, action, capability.summary);

  const usageEvents = payload.events.slice(-8).map((event) => ({
    ts: event.ts ?? "",
    source: event.source ?? "unknown",
    kind: event.kind ?? "unknown",
    sessionId: typeof event.sessionId === "string" ? event.sessionId : "unknown",
  }));

  const latest = payload.events.at(-1);
  const hasWarning =
    latest?.kind?.toLowerCase().includes("error") ||
    latest?.kind?.toLowerCase().includes("fail") ||
    latest?.kind?.toLowerCase().includes("warn");
  const presentationBuilder =
    usageEvents.length === 0
      ? "usageData가 비어 있어 empty 상태를 우선 렌더링한다."
      : hasWarning
        ? "최근 usageData의 경고/실패 신호를 우선 강조한다."
        : "최근 usageData의 정상 흐름을 요약해 상태 배지와 추천 동선을 구성한다.";
  const status: "empty" | "healthy" | "warning" =
    usageEvents.length === 0 ? "empty" : hasWarning ? "warning" : "healthy";
  const recentSources = [...new Set(usageEvents.map((event) => event.source))];
  const presentationData = {
    status,
    metrics: {
      // UI 4단계(usageData 목록)와 6단계(metrics.usageCount)가 같은 표본(최근 8건)을 보게 맞춘다.
      usageCount: usageEvents.length,
      recentSources,
    },
    latestEvent:
      latest == null
        ? null
        : {
            ts: latest.ts ?? "",
            kind: latest.kind ?? "unknown",
            source: latest.source ?? "unknown",
            sessionId:
              typeof latest.sessionId === "string" ? latest.sessionId : "unknown",
          },
    highlightedText:
      status === "empty"
        ? "수집 이벤트가 아직 없어 기본 안내를 먼저 보여줍니다."
        : status === "warning"
          ? "최근 이벤트에 경고/실패 신호가 있어 우선 노출합니다."
          : "최근 이벤트 흐름이 정상으로 보여 다음 액션 추천을 노출합니다.",
    recommendation:
      status === "empty"
        ? "이벤트를 1건 이상 수집해 루프 관측을 시작하세요."
        : status === "warning"
          ? "최근 실패/경고 원인을 점검하고 재시도 액션을 우선 실행하세요."
          : "최근 이벤트를 기준으로 다음 구현/검증 액션을 선택하세요.",
    updatedAt: new Date().toISOString(),
    completeness: "complete" as const,
  };
  const ui =
    presentationData.status === "empty"
      ? "빈 상태 UI + 수집 시작 가이드"
      : presentationData.status === "warning"
        ? "경고 상태 배지 + 최신 이벤트 점검 + 복구 액션 제안"
        : "정상 상태 배지 + 최신 이벤트 요약 + 다음 액션 제안";

  const layerTriggers = layers.map((layer, idx) => {
    const prev = layers[idx - 1];
    const triggers =
      idx === 0 ? [] : (prev?.checklist ?? []).filter((c) => !c.checked).map((c) => c.text);
    const triggerSource =
      idx === 0
        ? "첫 단계(Need)는 루프 시작 입력 자체가 트리거"
        : `직전 단계(${prev?.title ?? "unknown"})의 미완 체크리스트`;
    return {
      key: layer.key,
      title: layer.title,
      triggerSource,
      triggerCount: triggers.length,
      triggers,
    };
  });

  const coreLayers = layers.filter((layer) => layer.thread === "core");
  const presentationLayers = layers.filter((layer) => layer.thread === "presentation");
  const opsLayers = layers.filter((layer) => layer.thread === "ops");

  return {
    generatedAt: new Date().toISOString(),
    layers,
    layerTriggers,
    orchestration: {
      mode: "triple-thread",
      rationale: "1~3(core) 실행, 4~7(presentation) 표현, 8(ops) 배포/디버깅을 분리해 병렬 운영",
      coreThread: {
        layers: coreLayers.map((layer) => layer.key),
        pendingChecklist: coreLayers.flatMap((layer) => layer.checklist).filter((c) => !c.checked).length,
        policy: "strict-sequence",
      },
      presentationThread: {
        layers: presentationLayers.map((layer) => layer.key),
        pendingChecklist: presentationLayers
          .flatMap((layer) => layer.checklist)
          .filter((c) => !c.checked).length,
        policy: "parallel-followup",
      },
      opsThread: {
        layers: opsLayers.map((layer) => layer.key),
        pendingChecklist: opsLayers.flatMap((layer) => layer.checklist).filter((c) => !c.checked).length,
        policy: "release-and-debug-gate",
      },
    },
    flow: {
      need,
      needSource,
      action,
      actionItems,
      capabilityLogic: capability.summary,
      capabilityLogicStructured: capability.structured,
      coreIntegrity,
      usageData: usageEvents,
      presentationBuilder,
      presentationData,
      ui,
      releaseDebug:
        latestError == null
          ? "현재 활성 에러 신호 없음. 빌드/배포 체크리스트를 진행하세요."
          : `최근 에러 로그 감지: ${latestError}`,
    },
  };
}
