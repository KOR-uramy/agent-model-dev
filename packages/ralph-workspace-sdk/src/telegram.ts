/**
 * 텔레그램 Bot API — 작업 알림·관측용 (선택).
 * @see https://core.telegram.org/bots/api#sendmessage
 */

export const TELEGRAM_ENV_KEYS = {
  BOT_TOKEN: "TELEGRAM_BOT_TOKEN",
  CHAT_ID: "TELEGRAM_CHAT_ID",
  /** `1`이면 `openg-graze-git-commit` 후 커밋 한 줄 알림 */
  NOTIFY_COMMITS: "TELEGRAM_NOTIFY_COMMITS",
} as const;

export type SendTelegramOptions = {
  /** 기본: process.env */
  env?: Record<string, string | undefined>;
  /** HTML/MarkdownV2 등 */
  parseMode?: "HTML" | "MarkdownV2";
};

/**
 * 지정한 채팅으로 전송. `botToken` 없으면 `TELEGRAM_BOT_TOKEN` env 사용.
 */
export async function sendTelegramToChat(
  chatId: string,
  text: string,
  opts: SendTelegramOptions & { botToken?: string } = {},
): Promise<boolean> {
  const env = opts.env ?? process.env;
  const token =
    opts.botToken?.trim() ?? env[TELEGRAM_ENV_KEYS.BOT_TOKEN]?.trim();
  if (!token || !chatId) return false;

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text: text.slice(0, 4000),
    disable_web_page_preview: true,
  };
  if (opts.parseMode) body.parse_mode = opts.parseMode;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.ok;
}

/**
 * `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`가 있을 때만 전송. 없으면 no-op.
 */
export async function sendTelegramMessage(
  text: string,
  opts: SendTelegramOptions = {},
): Promise<boolean> {
  const env = opts.env ?? process.env;
  const chatId = env[TELEGRAM_ENV_KEYS.CHAT_ID]?.trim();
  if (!chatId) return false;
  return sendTelegramToChat(chatId, text, opts);
}

export function telegramEnvHint(): Record<
  keyof typeof TELEGRAM_ENV_KEYS,
  string
> {
  return {
    BOT_TOKEN: `${TELEGRAM_ENV_KEYS.BOT_TOKEN}=123456:ABC...`,
    CHAT_ID: `${TELEGRAM_ENV_KEYS.CHAT_ID}=-100xxxxxxxx`,
    NOTIFY_COMMITS: `${TELEGRAM_ENV_KEYS.NOTIFY_COMMITS}=1`,
  };
}
