import { NextRequest } from "next/server";
import { prisma } from "@/server/db/client";
import {
  errorResponse,
  getUserId,
  jsonResponse,
  successResponse,
} from "@/server/utils/apiHelpers";
import { getAuthUser } from "@/server/auth/session";
import { createOdooClient, isOdooConfigured } from "@/server/utils/odooClient";
import {
  mapPosStateToOrderStatus,
  mapSaleStateToOrderStatus,
  normalizeOrderStatus,
  resolveOrderStatusPriority,
} from "@/lib/orderStatus";

/**
 * GET /api/orders/[id]/status/debug
 * Returns raw Odoo states and mapped status calculation for troubleshooting.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(request);
    const userId = authUser?.id || getUserId(request);

    const order = await prisma.order.findFirst({
      where: { id, userId },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        saleOrderId: true,
        posOrderId: true,
        odooStatusSale: true,
        odooStatusPos: true,
        updatedAt: true,
      },
    });

    if (!order) {
      return jsonResponse(errorResponse("Order not found"), 404);
    }

    if (order.paymentStatus !== "PAID" && order.paymentMethod !== "CASH") {
      return jsonResponse(errorResponse("Order not found"), 404);
    }

    let rawSaleState: string | null = null;
    let rawPosState: string | null = null;
    let rawOutgoingDeliveryStates: string[] = [];
    let rolledOutgoingDeliveryState: string | null = null;
    let effectiveSaleState: string | null = null;
    let saleMapped: string | null = null;
    let posMapped: string | null = null;
    let computedNextStatus = normalizeOrderStatus(order.status);

    if (isOdooConfigured() && (order.saleOrderId || order.posOrderId)) {
      const client = createOdooClient();

      if (client) {
        const sale = order.saleOrderId
          ? await client.getSaleOrderStatus(order.saleOrderId)
          : null;
        const pos = order.posOrderId
          ? await client.getPosOrderStatus(order.posOrderId)
          : null;

        rawSaleState = sale?.state || null;
        rawPosState = pos?.state || null;

        const deliveryRollup = order.saleOrderId
          ? await client.getSaleOutgoingDeliveryRollup(order.saleOrderId)
          : { states: [], rolledState: null as null };

        rawOutgoingDeliveryStates = deliveryRollup.states;
        rolledOutgoingDeliveryState = deliveryRollup.rolledState;

        effectiveSaleState = sale?.state || null;
        if (deliveryRollup.rolledState === "done") {
          effectiveSaleState = "done";
        } else if (deliveryRollup.rolledState === "cancel") {
          effectiveSaleState = "cancel";
        }

        saleMapped = mapSaleStateToOrderStatus(effectiveSaleState || undefined);
        posMapped = mapPosStateToOrderStatus(pos?.state);

        if (saleMapped || posMapped) {
          computedNextStatus = resolveOrderStatusPriority(
            "PENDING",
            saleMapped,
            posMapped,
          );
        }
      }
    }

    return jsonResponse(
      successResponse({
        orderId: order.id,
        local: {
          status: order.status,
          normalizedStatus: normalizeOrderStatus(order.status),
          paymentStatus: order.paymentStatus,
          saleOrderId: order.saleOrderId,
          posOrderId: order.posOrderId,
          odooStatusSale: order.odooStatusSale,
          odooStatusPos: order.odooStatusPos,
          updatedAt: order.updatedAt,
        },
        odoo: {
          rawSaleState,
          rawPosState,
          rawOutgoingDeliveryStates,
          rolledOutgoingDeliveryState,
          effectiveSaleState,
          saleMapped,
          posMapped,
        },
        computed: {
          nextStatus: computedNextStatus,
          mappingRules: {
            sale: {
              draft: "PENDING",
              sent: "PENDING",
              sale: "CONFIRMED",
              done: "DELIVERED",
              cancel: "CANCELLED",
            },
          },
        },
      }),
    );
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Failed to fetch debug order status";
    return jsonResponse(errorResponse(msg), 500);
  }
}
