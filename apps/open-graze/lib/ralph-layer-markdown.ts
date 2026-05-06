/**
 * Ralph layer md (01~08) 파싱·요약 — Core(1~3)와 layer-flow API 정합용.
 */

export type ChecklistItem = { text: string; checked: boolean };

export function parseChecklistItems(markdown: string): ChecklistItem[] {
  return markdown
    .split("\n")
    .map((line) => line.trim())
    .map((line) => {
      const m = line.match(/^[-*]\s+\[( |x|X)\]\s+(.+)$/);
      if (!m) return null;
      return { checked: m[1]!.toLowerCase() === "x", text: m[2]!.trim() };
    })
    .filter((x): x is ChecklistItem => x != null);
}

/** "## Checklist" 또는 첫 체크라인 직전 본문(제목 제외). */
export function extractBodyBeforeChecklist(content: string): string {
  const lines = content.split("\n");
  const bodyLines: string[] = [];
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith("## Checklist")) break;
    if (/^[-*]\s+\[( |x|X)\]\s+/.test(t)) break;
    if (t.startsWith("#")) continue;
    bodyLines.push(line.trimEnd());
  }
  return bodyLines.join("\n").trim();
}

const CAPABILITY_BODY_MAX = 480;

/**
 * Layer 03 md → flow.capabilityLogic 문자열 (본문 + 미완 체크).
 */
export function summarizeCapabilityLayerMarkdown(params: {
  title: string;
  content: string;
  checklist: ChecklistItem[];
}): string {
  const body = extractBodyBeforeChecklist(params.content);
  const clipped = body.length > CAPABILITY_BODY_MAX ? `${body.slice(0, CAPABILITY_BODY_MAX)}…` : body;
  const pending = params.checklist.filter((c) => !c.checked).map((c) => c.text);
  const pendingPart =
    pending.length > 0 ? `미완 비즈니스 체크: ${pending.join(" | ")}` : "";
  if (clipped && pendingPart) return `${clipped} · ${pendingPart}`;
  if (clipped) return clipped;
  if (pendingPart) return pendingPart;
  return `${params.title}: 요약할 본문·체크가 없습니다.`;
}

/**
 * progress tail + 02 Action md 미완 체크 → flow.action.
 */
export function summarizeActionForFlow(progressTail: string, layer02Checklist: ChecklistItem[]): string {
  const pending = layer02Checklist.filter((c) => !c.checked).map((c) => c.text);
  if (pending.length === 0) return progressTail;
  return `${progressTail} — Action md 미완: ${pending.join("; ")}`;
}
