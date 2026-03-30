import { NextRequest } from "next/server";
import { prisma } from "@/server/db/client";
import { getAuthUser } from "@/server/auth/session";
import { getUserId } from "@/server/utils/apiHelpers";
import { normalizeOrderStatus } from "@/lib/orderStatus";

const encoder = new TextEncoder();
const POLL_INTERVAL_MS = 2500;
const MAX_STREAM_MS = 1000 * 60 * 5;

type OrderStatusSnapshot = {
  id: string;
  status: string;
  paymentStatus: string;
  odooStatusSale: string;
  odooStatusPos: string;
  saleOrderId: number | null;
  posOrderId: number | null;
  odooWebUrl: string | null;
  updatedAt: Date;
  createdAt: Date;
};

async function getOrderSnapshot(
  orderId: string,
  userId: string,
): Promise<OrderStatusSnapshot | null> {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      odooStatusSale: true,
      odooStatusPos: true,
      saleOrderId: true,
      posOrderId: true,
      odooWebUrl: true,
      updatedAt: true,
      createdAt: true,
      paymentMethod: true,
    },
  });

  if (!order) {
    return null;
  }

  if (order.paymentStatus !== "PAID" && order.paymentMethod !== "CASH") {
    return null;
  }

  return {
    id: order.id,
    status: normalizeOrderStatus(order.status),
    paymentStatus: order.paymentStatus,
    odooStatusSale: order.odooStatusSale || "pending",
    odooStatusPos: order.odooStatusPos || "pending",
    saleOrderId: order.saleOrderId,
    posOrderId: order.posOrderId,
    odooWebUrl: order.odooWebUrl,
    updatedAt: order.updatedAt,
    createdAt: order.createdAt,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authUser = await getAuthUser(request);
  const userId = authUser?.id || getUserId(request);

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id: orderId } = await params;

  let closed = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      const startedAt = Date.now();
      let lastSerialized = "";

      const writeEvent = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const tick = async () => {
        if (closed) return;

        try {
          const snapshot = await getOrderSnapshot(orderId, userId);

          if (!snapshot) {
            writeEvent("error", { message: "Order not found" });
            closed = true;
            controller.close();
            return;
          }

          const serialized = JSON.stringify(snapshot);
          if (serialized !== lastSerialized) {
            lastSerialized = serialized;
            writeEvent("status", snapshot);
          }
        } catch (error) {
          writeEvent("error", {
            message: error instanceof Error ? error.message : "Stream failure",
          });
        }

        if (Date.now() - startedAt >= MAX_STREAM_MS) {
          writeEvent("end", { reason: "stream_timeout" });
          closed = true;
          controller.close();
          return;
        }

        timer = setTimeout(tick, POLL_INTERVAL_MS);
      };

      writeEvent("connected", { ok: true });
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
