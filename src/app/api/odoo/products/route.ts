/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { createOdooClient, isOdooConfigured } from "@/server/utils/odooClient";
import {
  jsonResponse,
  successResponse,
  errorResponse,
} from "@/server/utils/apiHelpers";

// GET /api/odoo/products
// Query:
// - model: 'product.product' | 'product.template' (default: product.product)
// - fields: csv of fields, or 'all' for all readable
// - limit/sample: number; required when random=true
// - random: boolean; random window sampling
// - includeInactive: boolean; include inactive items
// - expand: csv among [category,uom,taxes,template,attributes,images]
// - imageSize: one of image_128|image_1024|image_1920 (default image_128)
// - page,pageSize: optional pagination when not using random
export async function GET(request: NextRequest) {
  try {
    // Diagnostic-only: prefer /api/products (cache-backed) for production
    if (request.headers.get("x-diagnostic") !== "true") {
      return jsonResponse(
        errorResponse(
          "This endpoint is diagnostic-only. Use /api/products for production catalog.",
        ),
        400,
      );
    }
    if (!isOdooConfigured()) {
      return jsonResponse(errorResponse("Odoo is not configured"), 500);
    }

    const url = new URL(request.url);
    // Query params
    const model = (url.searchParams.get("model") || "product.product").trim();
    const limitParam =
      url.searchParams.get("limit") ??
      url.searchParams.get("sample") ??
      undefined;
    const parsedLimit = limitParam ? Number(limitParam) : undefined;
    const limit =
      Number.isFinite(parsedLimit as number) && (parsedLimit as number)! > 0
        ? (parsedLimit as number)
        : undefined;
    const random =
      (url.searchParams.get("random") ?? "false").toLowerCase() === "true";
    const includeInactive =
      (url.searchParams.get("includeInactive") ?? "false").toLowerCase() ===
      "true";
    const fieldsParam = url.searchParams.get("fields"); // e.g. id,name,default_code,list_price OR 'all'
    const fields =
      fieldsParam && fieldsParam.toLowerCase() !== "all"
        ? fieldsParam
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined; // undefined => fetch all readable fields
    const expandParam = url.searchParams.get("expand") || "";
    const expand = new Set(
      expandParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    );
    const imageSize = (url.searchParams.get("imageSize") || "image_128").trim();
    const page = Number(url.searchParams.get("page") || "1");
    const pageSize = Number(url.searchParams.get("pageSize") || "0");

    const client = createOdooClient();
    if (!client)
      return jsonResponse(errorResponse("Failed to init Odoo client"), 500);

    // Ensure product model exists
    const targetModel =
      model === "product.template" ? "product.template" : "product.product";
    let hasModel = await client.modelExists(targetModel).catch(() => false);
    // Automatic fallback: if variant model missing and user did not explicitly request it, fallback to product.template
    if (
      !hasModel &&
      targetModel === "product.product" &&
      model === "product.product"
    ) {
      const templateExists = await client
        .modelExists("product.template")
        .catch(() => false);
      if (templateExists) {
        hasModel = true;
        // Switch to template logic transparently
        console.warn(
          "Falling back to 'product.template' because 'product.product' model is unavailable.",
        );
      }
    }
    if (!hasModel) {
      return jsonResponse(
        errorResponse(
          `Odoo '${targetModel}' model isn't available. Install Inventory/Sales (sale_management) and Inventory (stock) modules.`,
        ),
        400,
      );
    }

    // Build domain
    const domain: any[] = [["sale_ok", "=", true]];
    if (!includeInactive) domain.push(["active", "=", true]);

    // Determine base fields
    // If we fell back (warning above), ensure targetModel reflects actual existing model
    const effectiveModel = hasModel
      ? (await client.modelExists(targetModel))
        ? targetModel
        : "product.template"
      : targetModel;
    const defaultFields =
      effectiveModel === "product.template"
        ? ["id", "name", "default_code", "list_price", "type", "active"]
        : ["id", "name", "default_code", "list_price", "type", "active"];

    // Ensure required fields for expansions are present
    const requiredForExpand: string[] = [];
    if (expand.has("template")) requiredForExpand.push("product_tmpl_id");
    if (expand.has("category")) requiredForExpand.push("categ_id");
    if (expand.has("uom")) requiredForExpand.push("uom_id");
    if (expand.has("taxes")) requiredForExpand.push("taxes_id");
    if (expand.has("attributes")) requiredForExpand.push("product_tmpl_id");
    if (expand.has("images")) requiredForExpand.push(imageSize);

    const fieldList = Array.from(
      new Set([...(fields ?? defaultFields), ...requiredForExpand]),
    );

    // If random, require a limit to sample deterministically
    let records: any[] = [];
    if (random) {
      if (!limit) {
        return jsonResponse(
          errorResponse(
            "When random=true, you must provide a limit or sample parameter.",
          ),
          400,
        );
      }
      const total = await client.searchCount(effectiveModel, domain);
      if (total === 0)
        return jsonResponse(
          successResponse<any[]>([], "No saleable products found"),
        );
      const safeLimit = Math.max(1, Math.min(limit, total));
      const offset =
        total > safeLimit ? Math.floor(Math.random() * (total - safeLimit)) : 0;
      records = await client.searchRead<any>(
        effectiveModel,
        domain,
        fieldList,
        { limit: safeLimit, offset },
      );
    } else {
      let kwargs: Record<string, unknown> = {};
      if (limit) kwargs = { limit, offset: 0 };
      if (!limit && pageSize > 0) {
        const p = Number.isFinite(page) && page > 0 ? page : 1;
        const ps = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 50;
        kwargs = { limit: ps, offset: (p - 1) * ps };
      }
      records = await client.searchRead<any>(
        effectiveModel,
        domain,
        fieldList,
        kwargs as any,
      );
    }

    // Optional expansions
    if (!records.length || expand.size === 0) {
      return jsonResponse(
        successResponse(
          records,
          `Fetched ${records.length} ${effectiveModel === "product.template" ? "templates" : "products"}`,
        ),
      );
    }

    // Collect IDs for batch reads
    const templateIds = new Set<number>();
    const categoryIds = new Set<number>();
    const uomIds = new Set<number>();
    const taxIds = new Set<number>();

    for (const r of records) {
      const categ = r.categ_id;
      if (Array.isArray(categ) && categ.length) categoryIds.add(categ[0]);
      const uom = r.uom_id;
      if (Array.isArray(uom) && uom.length) uomIds.add(uom[0]);
      const taxes = r.taxes_id as number[] | any;
      if (Array.isArray(taxes)) {
        for (const t of taxes) taxIds.add(typeof t === "number" ? t : t?.[0]);
      }
      const tmpl = r.product_tmpl_id;
      if (Array.isArray(tmpl) && tmpl.length) templateIds.add(tmpl[0]);
      if (targetModel === "product.template") templateIds.add(r.id as number);
    }

    const [templates, categories, uoms, taxes] = await Promise.all([
      expand.has("template") || expand.has("attributes") || expand.has("images")
        ? client.searchRead<any>(
            "product.template",
            [["id", "in", Array.from(templateIds)]],
            [
              "id",
              "name",
              "default_code",
              "list_price",
              "type",
              "active",
              "categ_id",
              "uom_id",
              "taxes_id",
              "attribute_line_ids",
              imageSize,
            ],
          )
        : Promise.resolve([]),
      expand.has("category")
        ? client.searchRead<any>(
            "product.category",
            [["id", "in", Array.from(categoryIds)]],
            ["id", "name", "parent_id"],
          )
        : Promise.resolve([]),
      expand.has("uom")
        ? client.searchRead<any>(
            "uom.uom",
            [["id", "in", Array.from(uomIds)]],
            ["id", "name"],
          )
        : Promise.resolve([]),
      expand.has("taxes")
        ? client.searchRead<any>(
            "account.tax",
            [["id", "in", Array.from(taxIds)]],
            ["id", "name", "amount", "type_tax_use"],
          )
        : Promise.resolve([]),
    ]);

    const templateMap = new Map<number, any>(
      templates.map((t: any) => [t.id, t]),
    );
    const categoryMap = new Map<number, any>(
      categories.map((c: any) => [c.id, c]),
    );
    const uomMap = new Map<number, any>(uoms.map((u: any) => [u.id, u]));
    const taxMap = new Map<number, any>(taxes.map((t: any) => [t.id, t]));

    // Attributes expansion via product.template.attribute.line
    let attrByTemplateId = new Map<number, any[]>();
    if (expand.has("attributes") && templateIds.size) {
      const attrLines = await client.searchRead<any>(
        "product.template.attribute.line",
        [["product_tmpl_id", "in", Array.from(templateIds)]],
        ["id", "product_tmpl_id", "attribute_id", "value_ids"],
      );
      const attributeIds = new Set<number>();
      const valueIds = new Set<number>();
      for (const l of attrLines) {
        if (Array.isArray(l.attribute_id)) attributeIds.add(l.attribute_id[0]);
        if (Array.isArray(l.value_ids))
          for (const v of l.value_ids) valueIds.add(v);
      }
      const [attributes, values] = await Promise.all([
        client.searchRead<any>(
          "product.attribute",
          [["id", "in", Array.from(attributeIds)]],
          ["id", "name"],
        ),
        client.searchRead<any>(
          "product.attribute.value",
          [["id", "in", Array.from(valueIds)]],
          ["id", "name", "attribute_id"],
        ),
      ]);
      const attrMap = new Map<number, any>(
        attributes.map((a: any) => [a.id, a]),
      );
      const valMap = new Map<number, any>(values.map((v: any) => [v.id, v]));
      // Group by template
      attrByTemplateId = new Map<number, any[]>();
      for (const l of attrLines) {
        const tmplId = Array.isArray(l.product_tmpl_id)
          ? l.product_tmpl_id[0]
          : l.product_tmpl_id;
        const attrId = Array.isArray(l.attribute_id)
          ? l.attribute_id[0]
          : l.attribute_id;
        const valIds: number[] = Array.isArray(l.value_ids) ? l.value_ids : [];
        const group = attrByTemplateId.get(tmplId) || [];
        group.push({
          attribute: attrMap.get(attrId) || { id: attrId },
          values: valIds.map((vid) => valMap.get(vid) || { id: vid }),
        });
        attrByTemplateId.set(tmplId, group);
      }
    }

    const expanded = records.map((r) => {
      const tmplId =
        targetModel === "product.template"
          ? (r.id as number)
          : Array.isArray(r.product_tmpl_id)
            ? r.product_tmpl_id[0]
            : undefined;
      const withExpansions: any = { ...r };
      if (expand.has("category")) {
        const categ = Array.isArray(r.categ_id) ? r.categ_id[0] : r.categ_id;
        if (categ) withExpansions.category = categoryMap.get(categ) || null;
      }
      if (expand.has("uom")) {
        const uom = Array.isArray(r.uom_id) ? r.uom_id[0] : r.uom_id;
        if (uom) withExpansions.uom = uomMap.get(uom) || null;
      }
      if (expand.has("taxes")) {
        const taxesIds: number[] = Array.isArray(r.taxes_id)
          ? r.taxes_id.map((x: any) => (typeof x === "number" ? x : x?.[0]))
          : [];
        withExpansions.taxes = taxesIds
          .map((tid) => taxMap.get(tid))
          .filter(Boolean);
      }
      if (expand.has("template") && tmplId) {
        const tmpl = templateMap.get(tmplId);
        if (tmpl) withExpansions.template = tmpl;
      }
      if (expand.has("images")) {
        // Prefer product image field first; fallback to template image
        const img =
          r[imageSize] ||
          (tmplId ? templateMap.get(tmplId)?.[imageSize] : undefined);
        if (img) withExpansions[imageSize] = img;
      }
      if (expand.has("attributes") && tmplId) {
        withExpansions.attributes = attrByTemplateId.get(tmplId) || [];
      }
      return withExpansions;
    });

    return jsonResponse(
      successResponse(
        expanded,
        `Fetched ${expanded.length} ${effectiveModel === "product.template" ? "templates" : "products"} with expansions`,
      ),
    );
  } catch (err: any) {
    return jsonResponse(
      errorResponse(err?.message || "Failed to fetch products"),
      500,
    );
  }
}
