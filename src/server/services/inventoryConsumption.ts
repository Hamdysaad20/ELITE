import { prisma } from "@/server/db/client";
import { createOdooClient, isOdooConfigured } from "@/server/utils/odooClient";
import { getInventoryAutomationUserId } from "./inventoryAutomation";

type ConsumptionSource = "online_order" | "pos_order";

interface ConsumeLine {
  referenceId: string;
  source: ConsumptionSource;
  productId: string;
  quantity: number;
  productName?: string;
}

async function createConsumptionMovements(lines: ConsumeLine[]) {
  const recordedById = await getInventoryAutomationUserId();
  if (!recordedById || lines.length === 0) return { created: 0, skipped: 0 };

  let created = 0;
  let skipped = 0;

  for (const line of lines) {
    const existing = await prisma.stockMovement.findFirst({
      where: {
        referenceType: line.source,
        referenceId: line.referenceId,
      },
      select: { id: true },
    });
    if (existing) {
      skipped++;
      continue;
    }

    const recipes = await prisma.recipe.findMany({
      where: {
        isActive: true,
        OR: [
          { productId: line.productId },
          { productId: line.productName || "" },
        ],
      },
      select: {
        id: true,
        ingredients: {
          select: { itemId: true, quantity: true, unit: true },
        },
      },
    });

    const movements = recipes.flatMap((recipe) =>
      recipe.ingredients.map((ingredient) => ({
        itemId: ingredient.itemId,
        location: "bar",
        type: "recipe_consumption",
        quantity: -Number(ingredient.quantity) * line.quantity,
        referenceType: line.source,
        referenceId: line.referenceId,
        note: `${line.source} consumed ${line.quantity} x ${line.productName || line.productId}`,
        recordedById,
      })),
    );

    if (movements.length === 0) {
      skipped++;
      continue;
    }

    await prisma.stockMovement.createMany({ data: movements });
    created += movements.length;
  }

  return { created, skipped };
}

export async function consumeInventoryForOnlineOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      paymentStatus: true,
      paymentMethod: true,
      items: {
        select: {
          id: true,
          productId: true,
          name: true,
          quantity: true,
        },
      },
    },
  });

  if (!order) return { created: 0, skipped: 0 };
  if (order.paymentStatus !== "PAID" && order.paymentMethod !== "CASH") {
    return { created: 0, skipped: order.items.length };
  }

  return createConsumptionMovements(
    order.items.map((item) => ({
      referenceId: `online:${order.id}:${item.id}`,
      source: "online_order",
      productId: item.productId,
      productName: item.name,
      quantity: item.quantity,
    })),
  );
}

export async function consumeInventoryForPaidOnlineOrders(since: Date) {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: since },
      OR: [{ paymentStatus: "PAID" }, { paymentMethod: "CASH" }],
    },
    select: { id: true },
  });

  let created = 0;
  let skipped = 0;
  for (const order of orders) {
    const result = await consumeInventoryForOnlineOrder(order.id);
    created += result.created;
    skipped += result.skipped;
  }

  return { orders: orders.length, created, skipped };
}

export async function consumeInventoryForOdooPosOrders(since: Date) {
  if (!isOdooConfigured()) {
    return { orders: 0, lines: 0, created: 0, skipped: 0, configured: false };
  }

  const client = createOdooClient();
  if (!client) {
    return { orders: 0, lines: 0, created: 0, skipped: 0, configured: false };
  }

  const orders = await client.searchRead<{
    id: number;
    name?: string;
    lines?: number[];
  }>(
    "pos.order",
    [
      ["date_order", ">=", since.toISOString().slice(0, 19).replace("T", " ")],
      ["state", "in", ["paid", "done", "invoiced"]],
    ],
    ["id", "name", "lines"],
    { limit: 250, order: "date_order desc" },
  );

  const lineIds = orders.flatMap((order) => order.lines || []);
  if (lineIds.length === 0) {
    return {
      orders: orders.length,
      lines: 0,
      created: 0,
      skipped: 0,
      configured: true,
    };
  }

  const lines = await client.searchRead<{
    id: number;
    order_id?: [number, string];
    product_id?: [number, string];
    qty?: number;
  }>(
    "pos.order.line",
    [["id", "in", lineIds]],
    ["id", "order_id", "product_id", "qty"],
  );

  const productIds = lines
    .map((line) => line.product_id?.[0])
    .filter((id): id is number => typeof id === "number");
  const products = await prisma.product.findMany({
    where: { odooId: { in: productIds } },
    select: { id: true, odooId: true, name: true },
  });
  const productByOdooId = new Map(
    products.map((product) => [product.odooId, product]),
  );

  const consumeLines: ConsumeLine[] = [];
  for (const line of lines) {
    const odooProductId = line.product_id?.[0];
    const product = odooProductId
      ? productByOdooId.get(odooProductId)
      : undefined;
    const quantity = Number(line.qty || 0);
    if (!product || quantity <= 0) continue;

    consumeLines.push({
      referenceId: `pos:${line.order_id?.[0] || "unknown"}:${line.id}`,
      source: "pos_order",
      productId: product.id,
      productName: product.name,
      quantity,
    });
  }

  const result = await createConsumptionMovements(consumeLines);

  return {
    orders: orders.length,
    lines: lines.length,
    configured: true,
    ...result,
  };
}
