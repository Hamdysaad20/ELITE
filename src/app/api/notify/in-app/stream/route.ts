import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { prisma } from "@/server/db/client";

const encoder = new TextEncoder();
const POLL_INTERVAL_MS = 5000;
const STREAM_DURATION_MS = 1000 * 60 * 5;

async function getPayload(userId: string) {
  const [notifications, unreadCount] = await Promise.all([
    prisma.itemAvailabilityNotification.findMany({
      where: {
        userId,
        notified: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        productId: true,
        createdAt: true,
      },
    }),
    prisma.itemAvailabilityNotification.count({
      where: {
        userId,
        notified: true,
      },
    }),
  ]);

  return {
    unreadCount,
    latest: notifications,
    serverTime: new Date().toISOString(),
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;

  let closed = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      const writeEvent = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      writeEvent("connected", { ok: true });

      const startedAt = Date.now();

      const tick = async () => {
        if (closed) return;

        try {
          const payload = await getPayload(userId);
          writeEvent("update", payload);
        } catch (error) {
          writeEvent("error", {
            message:
              error instanceof Error
                ? error.message
                : "Failed to load notifications",
          });
        }

        if (Date.now() - startedAt >= STREAM_DURATION_MS) {
          writeEvent("end", { reason: "stream_timeout" });
          closed = true;
          if (timer) {
            clearTimeout(timer);
            timer = null;
          }
          controller.close();
          return;
        }

        timer = setTimeout(tick, POLL_INTERVAL_MS);
      };

      tick();
    },
    cancel() {
      closed = true;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
