/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosInstance } from "axios";
import https from "node:https";
import type { Order, OrderItem } from "@/types";

export interface OdooConfig {
  host: string; // e.g. https://odoo.example.com:8069
  db: string;
  username: string;
  password: string;
  timeoutMs?: number;
  insecureSSL?: boolean; // if true, do not reject unauthorized SSL certs (not recommended for production)
}

interface JsonRpcRequest {
  jsonrpc: "2.0";
  method: "call";
  params: Record<string, unknown>;
  id?: number | string;
}

interface JsonRpcResponse<T = any> {
  jsonrpc: "2.0";
  id?: number | string | null;
  result?: T;
  error?: { code: number; message: string; data?: unknown };
}

export function isOdooConfigured(): boolean {
  return Boolean(
    process.env.ODOO_HOST &&
      process.env.ODOO_DB &&
      process.env.ODOO_USERNAME &&
      (process.env.ODOO_API_KEY || process.env.ODOO_PASSWORD),
  );
}

// Default timeout for Odoo operations - 60s is needed because order sync
// makes multiple sequential RPC calls (auth, find/create partner, find/create products, create order)
// and Odoo can be slow especially in shared hosting or during high load
const DEFAULT_ODOO_TIMEOUT_MS = 60000;

export function getOdooConfigFromEnv(): OdooConfig | null {
  if (!isOdooConfigured()) return null;
  return {
    host: String(process.env.ODOO_HOST),
    db: String(process.env.ODOO_DB),
    username: String(process.env.ODOO_USERNAME),
    password: String(process.env.ODOO_API_KEY || process.env.ODOO_PASSWORD),
    timeoutMs: process.env.ODOO_TIMEOUT_MS
      ? Number(process.env.ODOO_TIMEOUT_MS)
      : DEFAULT_ODOO_TIMEOUT_MS,
    insecureSSL: (process.env.ODOO_INSECURE_SSL || "").toLowerCase() === "true",
  };
}

export class OdooClient {
  private axios: AxiosInstance;
  private config: OdooConfig;
  private uid: number | null = null;

  constructor(config: OdooConfig) {
    this.config = config;
    this.axios = axios.create({
      baseURL: config.host.replace(/\/$/, ""),
      timeout: config.timeoutMs ?? DEFAULT_ODOO_TIMEOUT_MS,
      headers: { "Content-Type": "application/json" },
      httpsAgent: config.insecureSSL
        ? new https.Agent({ rejectUnauthorized: false })
        : undefined,
    });
  }

  private async authenticate(): Promise<number> {
    // If we already authenticated, reuse uid
    if (this.uid) return this.uid;

    // Use JSON-RPC 'common' service authenticate (works with API keys)
    const payload: JsonRpcRequest = {
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "common",
        method: "authenticate",
        args: [this.config.db, this.config.username, this.config.password, {}],
      },
      id: Date.now(),
    };

    const { data } = await this.axios.post<JsonRpcResponse<number | false>>(
      "/jsonrpc",
      payload,
    );
    if (data?.error) {
      throw new Error(`Odoo auth failed: ${JSON.stringify(data.error)}`);
    }
    if (typeof data?.result === "number" && data.result > 0) {
      this.uid = data.result;
      return this.uid;
    }
    throw new Error(`Odoo auth failed: ${JSON.stringify(data)}`);
  }

  private async rpc<T = any>(
    model: string,
    method: string,
    args: any[] = [],
    kwargs: Record<string, unknown> = {},
  ): Promise<T> {
    const uid = await this.authenticate();
    const payload: JsonRpcRequest = {
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "object",
        method: "execute_kw",
        args: [
          this.config.db,
          uid,
          this.config.password,
          model,
          method,
          args,
          kwargs,
        ],
      },
      id: Date.now(),
    };

    const { data } = await this.axios.post<JsonRpcResponse<T>>(
      "/jsonrpc",
      payload,
    );
    if (data?.error) {
      throw new Error(
        `Odoo RPC error: ${data.error.message} :: ${JSON.stringify(
          data.error.data,
        )}`,
      );
    }
    return data.result as T;
  }

  /** Generic search_read helper */
  async searchRead<T = any>(
    model: string,
    domain: any[] = [],
    fields?: string[],
    kwargs: Record<string, unknown> = {},
  ): Promise<T[]> {
    const options = { ...(fields ? { fields } : {}), ...kwargs } as Record<
      string,
      unknown
    >;
    return this.rpc<T[]>(model, "search_read", [domain], options);
  }

  /**
   * Search and read with pagination support for large datasets
   * Automatically handles pagination to fetch all records
   *
   * @param model - Odoo model name
   * @param domain - Search domain
   * @param fields - Fields to fetch
   * @param batchSize - Number of records per batch (default: 1000, max: 5000)
   * @param kwargs - Additional search_read options
   * @returns All records matching the domain
   */
  async searchReadPaginated<T = any>(
    model: string,
    domain: any[] = [],
    fields?: string[],
    batchSize: number = 1000,
    kwargs: Record<string, unknown> = {},
  ): Promise<T[]> {
    // Enforce max batch size to prevent memory issues
    const safeBatchSize = Math.min(Math.max(1, batchSize), 5000);

    const allResults: T[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const batchOptions = {
        ...(fields ? { fields } : {}),
        ...kwargs,
        limit: safeBatchSize,
        offset,
      } as Record<string, unknown>;

      const batch = await this.rpc<T[]>(
        model,
        "search_read",
        [domain],
        batchOptions,
      );

      if (batch.length === 0) {
        hasMore = false;
      } else {
        allResults.push(...batch);
        offset += batch.length;

        // If we got fewer results than requested, we've reached the end
        if (batch.length < safeBatchSize) {
          hasMore = false;
        }
      }
    }

    return allResults;
  }

  /**
   * Search for a pricelist by name
   */
  async findPricelistByName(name: string): Promise<number | null> {
    const pricelists = await this.searchRead<{ id: number; name: string }>(
      "product.pricelist",
      [
        ["name", "=", name],
        ["active", "=", true],
      ],
      ["id", "name"],
      { limit: 1 },
    );
    return pricelists && pricelists.length > 0 ? pricelists[0].id : null;
  }

  /**
   * Get all active pricelists (for deals)
   */
  async getAllActivePricelists(): Promise<Array<{ id: number; name: string }>> {
    return this.searchRead<{ id: number; name: string }>(
      "product.pricelist",
      [["active", "=", true]],
      ["id", "name"],
    );
  }

  /**
   * Check if Odoo has native combo product support
   * In Odoo 19, combo products are product.template with type='combo'
   */
  async hasComboProductSupport(): Promise<boolean> {
    try {
      // Check if product.template has 'type' field that can be 'combo'
      const templates = await this.searchRead<any>(
        "product.template",
        [["type", "=", "combo"]],
        ["id"],
        { limit: 1 },
      );
      return templates !== null && templates.length > 0;
    } catch (error) {
      // If field doesn't exist or model doesn't support it, return false
      console.log(
        "[OdooClient] Combo product support check failed (may not be available):",
        error,
      );
      return false;
    }
  }

  /**
   * Fetch native combo products from Odoo
   * Returns products with type='combo' and their choice sets
   */
  async getComboProducts(): Promise<
    Array<{
      id: number;
      name: string;
      list_price: number;
      combo_line_ids?: number[]; // Choice set line IDs
    }>
  > {
    try {
      const combos = await this.searchRead<{
        id: number;
        name: string;
        list_price: number;
        combo_line_ids?: number[];
      }>(
        "product.template",
        [
          ["type", "=", "combo"],
          ["sale_ok", "=", true],
          ["active", "=", true],
        ],
        ["id", "name", "list_price", "combo_line_ids"],
      );
      return combos || [];
    } catch (error) {
      console.error("[OdooClient] Error fetching combo products:", error);
      return [];
    }
  }

  /**
   * Get combo choice sets for a combo product
   * Returns the choice sets (what products can be selected in the combo)
   */
  async getComboChoiceSets(comboProductId: number): Promise<
    Array<{
      id: number;
      product_id: number;
      name: string;
      required: boolean;
      quantity: number;
    }>
  > {
    try {
      // In Odoo 19, combo choice sets are stored in product.combo.line
      // This is a many2many relationship from product.template
      const comboLines = await this.searchRead<{
        id: number;
        product_id: number | [number, string];
        name: string;
        required: boolean;
        quantity: number;
      }>(
        "product.combo.line",
        [["combo_id", "=", comboProductId]],
        ["id", "product_id", "name", "required", "quantity"],
      );

      return (comboLines || []).map((line) => ({
        id: line.id,
        product_id: Array.isArray(line.product_id)
          ? line.product_id[0]
          : line.product_id,
        name: line.name,
        required: line.required || false,
        quantity: line.quantity || 1,
      }));
    } catch (error) {
      console.error(
        `[OdooClient] Error fetching combo choice sets for ${comboProductId}:`,
        error,
      );
      return [];
    }
  }

  /**
   * Get product price with pricelist context
   * This uses Odoo's price_get method which respects pricelists
   *
   * Note: Odoo's price_get signature is: price_get(product_ids, pricelist_id, qty, partner_id, uom_id, date)
   * We use a simplified version with just product_ids, pricelist_id, and qty
   */
  async getProductPriceWithPricelist(
    productId: number,
    pricelistId: number,
    qty: number = 1,
  ): Promise<number> {
    try {
      const uid = await this.authenticate();
      // Odoo price_get returns a dict: { productId: { price: value, ... } }
      const result = await this.rpc<Record<number, { price: number }>>(
        "product.product",
        "price_get",
        [[productId], pricelistId, qty],
      );
      // Extract price from result
      const priceData = result[productId];
      return priceData?.price || 0;
    } catch (error) {
      console.error(
        `[OdooClient] Failed to get price for product ${productId} with pricelist ${pricelistId}:`,
        error,
      );
      return 0;
    }
  }

  /** Generic search_count helper */
  async searchCount(model: string, domain: any[] = []): Promise<number> {
    return this.rpc<number>(model, "search_count", [domain]);
  }

  /**
   * Lightweight connectivity check.
   * Authenticates and performs a tiny RPC (search_count on res.partner).
   */
  async ping(): Promise<{ uid: number; partnerCount: number }> {
    const uid = await this.authenticate();
    const partnerCount = await this.rpc<number>("res.partner", "search_count", [
      [],
    ]);
    return { uid, partnerCount };
  }

  async findOrCreatePartner(partnerData: {
    name: string;
    email?: string;
    phone?: string;
    street?: string;
    city?: string;
    zip?: string;
    country_id?: number; // optional, if looked up
  }): Promise<number> {
    const searchDomain = partnerData.email
      ? [["email", "=", partnerData.email]]
      : partnerData.phone
        ? [["phone", "=", partnerData.phone]]
        : [["name", "=", partnerData.name]];

    const ids = await this.rpc<number[]>("res.partner", "search", [
      searchDomain,
      0,
      1,
    ]);

    if (ids && ids.length) {
      // Optionally update basic fields
      try {
        await this.rpc("res.partner", "write", [ids, partnerData]);
      } catch (_) {
        // ignore write failures to avoid blocking
      }
      return ids[0];
    }

    const id = await this.rpc<number>("res.partner", "create", [partnerData]);
    return id;
  }

  private async findOrCreateProduct(
    item: Pick<OrderItem, "menuItemId" | "unitPrice" | "menuItem">,
  ): Promise<number> {
    // Use website menuItemId as SKU (default_code). Fallback by name.
    const sku = item.menuItemId;
    const name = item.menuItem?.name || item.menuItemId || "Unknown Product";

    const domain = sku ? [["default_code", "=", sku]] : [["name", "=", name]];

    const prodIds = await this.rpc<number[]>("product.product", "search", [
      domain,
      0,
      1,
    ]);

    if (prodIds && prodIds.length) return prodIds[0];

    // Create minimal product - ensure name is never null
    const productVals = {
      name: name || "Product",
      default_code: sku || undefined,
      list_price: item.unitPrice,
      sale_ok: true,
      purchase_ok: false,
      type: "consu",
    };
    const productId = await this.rpc<number>("product.product", "create", [
      productVals,
    ]);
    return productId;
  }

  async createSaleOrderFromWebsiteOrder(
    websiteOrder: Order,
    partnerHint?: {
      name?: string;
      email?: string;
      phone?: string;
      street?: string;
      city?: string;
      zip?: string;
    },
  ): Promise<number> {
    // Idempotency: search by client_order_ref
    const existing = await this.rpc<number[]>(
      "sale.order",
      "search",
      [[["client_order_ref", "=", websiteOrder.id]]],
      { limit: 1 },
    );
    if (existing && existing.length) return existing[0];

    const partnerId = await this.findOrCreatePartner({
      name: partnerHint?.name || `Website User ${websiteOrder.userId}`,
      email: partnerHint?.email,
      phone: partnerHint?.phone,
      street: partnerHint?.street,
      city: partnerHint?.city,
      zip: partnerHint?.zip,
    });

    const lines: any[] = [];
    for (const line of websiteOrder.items) {
      const productId = await this.findOrCreateProduct({
        menuItemId: line.menuItemId,
        unitPrice: line.unitPrice,
        menuItem: line.menuItem,
      });

      lines.push([
        0,
        0,
        {
          product_id: productId,
          name: line.menuItem?.name || line.menuItemId,
          product_uom_qty: line.quantity,
          price_unit: line.unitPrice,
          // tax_id can be set by fiscal position or left empty
          // tax_id: [[6, 0, [taxId]]],
        },
      ]);
    }

    const saleVals: Record<string, unknown> = {
      partner_id: partnerId,
      client_order_ref: websiteOrder.id,
      order_line: lines,
      note:
        websiteOrder.notes ||
        `Created from website order ${websiteOrder.orderNumber}`,
    };

    const saleId = await this.rpc<number>("sale.order", "create", [saleVals]);
    return saleId;
  }

  /** Check whether a given model is available in this Odoo DB */
  async modelExists(modelName: string): Promise<boolean> {
    const count = await this.rpc<number>("ir.model", "search_count", [
      [["model", "=", modelName]],
    ]);
    return (count || 0) > 0;
  }

  /** Confirm a sale order (turn quotation into order). Requires Sales app. */
  async confirmSaleOrder(saleId: number): Promise<boolean> {
    // action_confirm expects a list of IDs
    await this.rpc("sale.order", "action_confirm", [[saleId]]);
    return true;
  }

  // -----------------------------
  // POS helpers (for Kitchen Display)
  // -----------------------------

  /** Get minimal list of POS configs */
  async getPosConfigs(): Promise<Array<{ id: number; name: string }>> {
    return this.searchRead(
      "pos.config",
      [["active", "=", true]],
      ["id", "name"],
    );
  }

  /** Get an open POS session for a given config (if any) */
  async getOpenPosSession(configId: number): Promise<number | null> {
    const ids = await this.rpc<number[]>(
      "pos.session",
      "search",
      [
        [
          ["config_id", "=", configId],
          ["state", "=", "opened"],
        ],
      ],
      { limit: 1 },
    );
    return ids?.length ? ids[0] : null;
  }

  /** Ensure the given product can be sold in POS (available_in_pos on product template) */
  private async ensureProductAvailableInPOS(productId: number): Promise<void> {
    try {
      const prod = await this.searchRead<any>(
        "product.product",
        [["id", "=", productId]],
        ["id", "product_tmpl_id", "available_in_pos"],
      );
      if (!prod?.length) return;
      const tmplId = Array.isArray(prod[0].product_tmpl_id)
        ? prod[0].product_tmpl_id[0]
        : prod[0].product_tmpl_id;
      const available = Boolean(prod[0].available_in_pos);
      if (!available && tmplId) {
        await this.rpc("product.template", "write", [
          [tmplId],
          { available_in_pos: true },
        ]);
      }
    } catch (_) {
      // non-fatal
    }
  }

  /**
   * Create a POS Order using create_from_ui so it appears in POS/Kitchen Display.
   * Requirements:
   * - POS module installed (pos.order model exists)
   * - An open POS session for the chosen configuration
   */
  async createPosOrderFromWebsiteOrder(
    websiteOrder: Order,
    partnerHint: {
      name?: string;
      email?: string;
      phone?: string;
      street?: string;
      city?: string;
      zip?: string;
    },
    options?: {
      posConfigId?: number;
      posConfigName?: string;
      customerNotePerLine?: string;
    },
  ): Promise<number> {
    // Select POS config
    let configId: number | undefined = options?.posConfigId;
    if (!configId) {
      if (options?.posConfigName) {
        const cfg = await this.searchRead<any>(
          "pos.config",
          [["name", "=", options.posConfigName]],
          ["id", "name"],
          { limit: 1 },
        );
        if (cfg?.length) configId = cfg[0].id;
      }
      if (!configId) {
        const cfgs = await this.getPosConfigs();
        if (!cfgs?.length)
          throw new Error(
            "No POS configuration found (install and configure Point of Sale)",
          );
        configId = cfgs[0].id;
      }
    }

    // Find an open POS session
    const sessionId = await this.getOpenPosSession(configId);
    if (!sessionId) {
      throw new Error(
        "No open POS session found. Open a POS session in Odoo to send orders to the kitchen.",
      );
    }

    // Partner
    const partnerId = await this.findOrCreatePartner({
      name: partnerHint?.name || `Website User ${websiteOrder.userId}`,
      email: partnerHint?.email,
      phone: partnerHint?.phone,
      street: partnerHint?.street,
      city: partnerHint?.city,
      zip: partnerHint?.zip,
    });

    // Build POS order lines
    const lines: any[] = [];
    for (const line of websiteOrder.items) {
      const productId = await this.findOrCreateProduct({
        menuItemId: line.menuItemId,
        unitPrice: line.unitPrice,
        menuItem: line.menuItem,
      });
      await this.ensureProductAvailableInPOS(productId);

      const customer_note =
        options?.customerNotePerLine || websiteOrder.notes || undefined;
      lines.push([
        0,
        0,
        {
          product_id: productId,
          qty: line.quantity,
          price_unit: line.unitPrice,
          discount: 0,
          ...(customer_note ? { customer_note } : {}),
        },
      ]);
    }

    const amount_total = websiteOrder.items.reduce(
      (s, l) => s + l.quantity * l.unitPrice,
      0,
    );
    const uid = `webpos_${websiteOrder.id}`;

    const orderData: any = {
      uid,
      to_invoice: false,
      data: {
        name: websiteOrder.orderNumber,
        partner_id: partnerId,
        pos_session_id: sessionId,
        sequence_number: 1,
        lines,
        amount_total,
        amount_tax: 0,
        amount_paid: 0,
        amount_return: 0,
        note: websiteOrder.notes || undefined,
      },
    };

    // Try modern/newer APIs first, then fall back
    const tryMethods: Array<{ name: string; payload: any[] }> = [
      { name: "create_orders_from_ui", payload: [[orderData]] },
      { name: "create_from_ui", payload: [[orderData]] },
    ];

    let lastErr: any;
    for (const m of tryMethods) {
      try {
        const res = await this.rpc<any>("pos.order", m.name, m.payload);
        let createdId: number | undefined;
        if (Array.isArray(res)) {
          createdId = typeof res[0] === "number" ? res[0] : res[0]?.id;
        } else if (typeof res === "number") {
          createdId = res;
        } else if (res && typeof res === "object" && "id" in res) {
          createdId = (res as any).id;
        }
        if (createdId) return createdId;
        lastErr = new Error(
          `Unexpected response from POS ${m.name}: ${JSON.stringify(res)}`,
        );
      } catch (err) {
        lastErr = err;
      }
    }

    // Last resort: try direct record creation (may not trigger KDS live events)
    try {
      // Generate pos_reference and date_order for the fallback
      const pos_reference = websiteOrder.orderNumber || uid;
      const date_order = new Date().toISOString();

      // Create the POS order first
      const createResult = await this.rpc<number | number[]>(
        "pos.order",
        "create",
        [
          {
            partner_id: partnerId,
            session_id: sessionId,
            amount_total,
            amount_tax: 0,
            amount_paid: 0,
            amount_return: 0,
            pos_reference: pos_reference,
            date_order: date_order,
          },
        ],
      );

      // Extract the order ID (handle both single ID and array responses)
      const orderId = Array.isArray(createResult)
        ? createResult[0]
        : createResult;

      if (!orderId) {
        throw new Error("Failed to get order ID from create response");
      }

      // Create lines directly (one at a time to avoid array issues)
      for (const l of lines) {
        const base = l[2] as any;
        const lineVals = {
          order_id: orderId, // Single integer, not array
          product_id: base.product_id,
          qty: base.qty,
          price_unit: base.price_unit,
          discount: base.discount ?? 0,
          ...(base.customer_note ? { customer_note: base.customer_note } : {}),
        };
        await this.rpc("pos.order.line", "create", [lineVals]);
      }
      return orderId;
    } catch (fallbackErr) {
      throw new Error(
        `Failed to create POS order via RPC methods (create_orders_from_ui/create_from_ui) and direct create. Last error: ${lastErr?.message || String(lastErr)} | Fallback error: ${(fallbackErr as any)?.message || String(fallbackErr)}`,
      );
    }
  }
}

export function createOdooClient(): OdooClient | null {
  const cfg = getOdooConfigFromEnv();
  if (!cfg) return null;
  return new OdooClient(cfg);
}
