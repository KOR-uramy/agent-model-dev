import { prisma } from "@/lib/prisma";
import { parseTelegramChatWorkspaceMap } from "@/lib/telegram-map";
import { sendTelegramToChat } from "ralph-workspace-sdk";
import { NextResponse } from "next/server";

type TelegramMessage = {
  message_id?: number;
  chat?: { id?: number; type?: string };
  from?: { id?: number; username?: string };
  text?: string;
};

type TelegramUpdate = {
  update_id?: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
};

function getMessage(u: TelegramUpdate): TelegramMessage | undefined {
  return u.message ?? u.edited_message;
}

/**
 * BotFather에서 `setWebhook` 시 `secret_token`과 동일 값을
 * `TELEGRAM_WEBHOOK_SECRET`에 두고, 요청 헤더
 * `X-Telegram-Bot-Api-Secret-Token`으로 검증합니다.
 *
 * @see https://core.telegram.org/bots/api#setwebhook
 */
export async function POST(req: Request) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET?.trim() ?? "";
  const got =
    req.headers.get("x-telegram-bot-api-secret-token")?.trim() ?? "";
  if (!expected || got !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const update = body as TelegramUpdate;
  const msg = getMessage(update);
  const chatIdNum = msg?.chat?.id;
  if (msg == null || chatIdNum == null) {
    return NextResponse.json({ ok: true, skipped: "no_message" });
  }

  const chatId = String(chatIdNum);
  const slugMap = parseTelegramChatWorkspaceMap(
    process.env.TELEGRAM_CHAT_WORKSPACE_MAP,
  );
  const slug = slugMap.get(chatId);
  if (!slug) {
    return NextResponse.json({ ok: true, skipped: "unknown_chat" });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!workspace) {
    return NextResponse.json({ ok: true, skipped: "unknown_workspace" });
  }

  const text = (msg.text ?? "").trim();
  const taskMatch = /^\/task(?:@\S+)?\s*([\s\S]*)$/.exec(text);
  const kind = taskMatch ? "telegram.task" : "telegram.message";
  const taskBody = taskMatch ? taskMatch[1].trim() : undefined;

  const payload = {
    text: text || undefined,
    taskBody: taskBody || undefined,
    chatId,
    from: msg.from
      ? { id: msg.from.id, username: msg.from.username }
      : undefined,
    messageId: msg.message_id,
    updateId: update.update_id,
  };

  await prisma.ingestedEvent.create({
    data: {
      workspaceId: workspace.id,
      kind,
      payload: JSON.stringify(payload),
    },
  });

  if (
    process.env.TELEGRAM_REPLY_ACK === "1" &&
    process.env.TELEGRAM_BOT_TOKEN?.trim()
  ) {
    await sendTelegramToChat(chatId, "✓ OpenGraze에 기록했습니다.", {
      botToken: process.env.TELEGRAM_BOT_TOKEN.trim(),
    });
  }

  return NextResponse.json({ ok: true });
}
