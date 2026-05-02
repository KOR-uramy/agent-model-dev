/**
 * `TELEGRAM_CHAT_WORKSPACE_MAP` — 쉼표로 구분된 `chatId:workspaceSlug` 쌍.
 * 예: `-1001234567890:my-team,-987654321:demo`
 */
export function parseTelegramChatWorkspaceMap(
  raw: string | undefined,
): Map<string, string> {
  const map = new Map<string, string>();
  if (!raw?.trim()) return map;
  for (const part of raw.split(",")) {
    const t = part.trim();
    if (!t) continue;
    const i = t.indexOf(":");
    if (i <= 0) continue;
    const chatId = t.slice(0, i).trim();
    const slug = t.slice(i + 1).trim();
    if (chatId && slug) map.set(chatId, slug);
  }
  return map;
}
