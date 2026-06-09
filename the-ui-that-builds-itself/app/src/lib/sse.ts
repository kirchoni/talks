export type SseSender = (event: string, data: unknown) => void;

function encodeSse(event: string, data: unknown) {
  const payload = typeof data === "string" ? data : JSON.stringify(data);

  return `event: ${event}\ndata: ${payload}\n\n`;
}

export function sseResponse(start: (send: SseSender) => Promise<void>) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send: SseSender = (event, data) => {
        controller.enqueue(encoder.encode(encodeSse(event, data)));
      };

      try {
        await start(send);
      } finally {
        controller.close();
      }
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
