import { readJsonBodyLimited } from "@/lib/ingest-body";
import {
  consumeIngestRateLimitToken,
  ingestRateLimitHeaders,
} from "@/lib/ingest-rate-limit";
import { prisma } from "@/lib/prisma";
import { digestToken } from "@/lib/tokens";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  kind: z.string().min(1).max(120),
  data: z.record(z.string(), z.unknown()).optional(),
});

/**
 * 외부 앱·브라우저에서 이벤트 수집.
 * `Authorization: Bearer og_live_...`
 */
export async function POST(req: Request) {
  const authz = req.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(authz.trim());
  if (!m) {
    return NextResponse.json(
      { error: "Missing Authorization: Bearer <token>" },
      { status: 401 },
    );
  }
  const token = m[1].trim();
  const digest = digestToken(token);

  const apiKey = await prisma.apiKey.findUnique({
    where: { tokenDigest: digest },
    include: { workspace: true },
  });
  if (!apiKey) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const rl = consumeIngestRateLimitToken(apiKey.id);
  if (!rl.ok) {
    const headers = ingestRateLimitHeaders(rl);
    console.warn(
      JSON.stringify({
        event: "ingest_rate_limited",
        workspaceId: apiKey.workspaceId,
        apiKeyPrefix: apiKey.prefix,
        limit: rl.limit,
        retryAfterSec: rl.retryAfterSec,
      }),
    );
    return NextResponse.json(
      {
        error: "Too many requests",
        code: "rate_limited",
        retryAfterSeconds: rl.retryAfterSec,
        retryableAt: new Date(rl.resetAtMs).toISOString(),
        limitPerWindow: rl.limit,
      },
      { status: 429, headers },
    );
  }

  const bodyRead = await readJsonBodyLimited(req);
  if (!bodyRead.ok) {
    const h = ingestRateLimitHeaders(rl);
    if (bodyRead.status === 413) {
      console.warn(
        JSON.stringify({
          event: "ingest_body_rejected",
          reason: "too_large",
          workspaceId: apiKey.workspaceId,
          apiKeyPrefix: apiKey.prefix,
        }),
      );
    }
    return NextResponse.json(
      { error: bodyRead.error },
      { status: bodyRead.status, headers: h },
    );
  }

  const parsed = bodySchema.safeParse(bodyRead.value);
  if (!parsed.success) {
    const h = ingestRateLimitHeaders(rl);
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400, headers: h },
    );
  }

  await prisma.$transaction([
    prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    }),
    prisma.ingestedEvent.create({
      data: {
        workspaceId: apiKey.workspaceId,
        kind: parsed.data.kind,
        payload: JSON.stringify(parsed.data.data ?? {}),
      },
    }),
  ]);

  if (process.env.INGEST_LOG_EACH_REQUEST === "1") {
    console.log(
      JSON.stringify({
        event: "ingest_ok",
        workspaceId: apiKey.workspaceId,
        apiKeyPrefix: apiKey.prefix,
        kind: parsed.data.kind,
      }),
    );
  }

  const okHeaders = ingestRateLimitHeaders(rl);
  return NextResponse.json({ ok: true }, { headers: okHeaders });
}
