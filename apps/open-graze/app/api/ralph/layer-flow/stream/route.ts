import { buildLayerFlowPayload } from "@/lib/ralph-layer-flow";

const SSE_INTERVAL_MS = 3000;

function sseEvent(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET(req: Request) {
  const encoder = new TextEncoder();
  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let active = true;

      const pushSnapshot = async () => {
        try {
          const payload = await buildLayerFlowPayload();
          controller.enqueue(encoder.encode(sseEvent("layer-flow", payload)));
          if (!payload.flow.coreIntegrity.ok) {
            controller.enqueue(
              encoder.encode(
                sseEvent("core-integrity-warning", {
                  level: "warning",
                  message: "core(1~3) 데이터 무결성 이슈가 감지되어 핸드오프 점검이 필요합니다.",
                  coreIntegrity: payload.flow.coreIntegrity,
                }),
              ),
            );
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "unknown error";
          controller.enqueue(encoder.encode(sseEvent("error", { error: "layer_flow_failed", message })));
        }
      };

      await pushSnapshot();

      const timer = setInterval(async () => {
        if (!active) return;
        await pushSnapshot();
      }, SSE_INTERVAL_MS);

      const heartbeat = setInterval(() => {
        if (!active) return;
        controller.enqueue(encoder.encode(": keepalive\n\n"));
      }, 15000);

      const teardown = () => {
        if (!active) return;
        active = false;
        clearInterval(timer);
        clearInterval(heartbeat);
        controller.close();
      };
      cleanup = teardown;

      controller.enqueue(encoder.encode(sseEvent("ready", { ok: true })));
      req.signal.addEventListener("abort", teardown, { once: true });
    },
    cancel() {
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
