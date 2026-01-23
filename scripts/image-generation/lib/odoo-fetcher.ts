import { createOdooClient } from "@/server/utils/odooClient";

// Define simplified types for our ingestion needs
export interface RawOdooProduct {
    id: number;
    name: string;
    default_code?: string; // SKU
    list_price?: number;
    categ_id?: [number, string] | number; // Odoo M2O field
    active?: boolean;
    sale_ok?: boolean;
    product_tmpl_id?: [number, string] | number;
    // Attributes will be attached later
    attributes?: Record<string, string[]>;
}

export interface RawOdooCategory {
    id: number;
    name: string;
    parent_id?: [number, string] | number;
    display_name: string;
}

export class FluxOdooFetcher {
    private client = createOdooClient();

    constructor() {
        if (!this.client) {
            throw new Error("Odoo configuration missing. Check .env file.");
        }
    }

    async fetchCategories(): Promise<RawOdooCategory[]> {
        if (!this.client) throw new Error("Client not initialized");

        console.log("Fetching categories...");
        const categories = await this.client.searchRead<RawOdooCategory>(
            "product.category",
            [], // Fetch all categories
            ["id", "name", "parent_id", "display_name"]
        );
        return categories;
    }

    async fetchProducts(): Promise<RawOdooProduct[]> {
        if (!this.client) throw new Error("Client not initialized");

        console.log("Fetching products...");
        const batchSize = 1000;
        const domain = [["sale_ok", "=", true], ["active", "=", true]];
        const fields = [
            "id",
            "name",
            "default_code",
            "list_price",
            "categ_id",
            "active",
            "sale_ok",
            "product_tmpl_id"
        ];

        // Using the existing searchReadPaginated from OdooClient
        const products = await this.client.searchReadPaginated<RawOdooProduct>(
            "product.product",
            domain,
            fields,
            batchSize
        );

        console.log(`Fetched ${products.length} products.`);

        // Now fetch attributes for these products
        // We need to fetch attributes from product.template
        const templateIds = [...new Set(products.map(p =>
            Array.isArray(p.product_tmpl_id) ? p.product_tmpl_id[0] : p.product_tmpl_id
        ).filter((id): id is number => typeof id === 'number'))];

        console.log(`Fetching attributes for ${templateIds.length} templates...`);

        // Batch fetch attributes to prevent payload limits
        const BATCH_SIZE = 500;
        const ptavs: {
            id: number;
            product_tmpl_id: [number, string] | number;
            attribute_id: [number, string] | number;
            name: string;
        }[] = [];

        for (let i = 0; i < templateIds.length; i += BATCH_SIZE) {
            const batchIds = templateIds.slice(i, i + BATCH_SIZE);
            console.log(`Fetching attributes for batch ${i / BATCH_SIZE + 1} (${batchIds.length} templates)...`);

            const batchResults = await this.client.searchRead<{
                id: number;
                product_tmpl_id: [number, string] | number;
                attribute_id: [number, string] | number;
                name: string;
            }>(
                "product.template.attribute.value",
                [["product_tmpl_id", "in", batchIds]],
                ["id", "product_tmpl_id", "attribute_id", "name"]
            );

            ptavs.push(...batchResults);
        }

        // Map attributes to templates
        const attributesByTemplate = new Map<number, Record<string, string[]>>();

        for (const ptav of ptavs) {
            const tmplId = Array.isArray(ptav.product_tmpl_id) ? ptav.product_tmpl_id[0] : ptav.product_tmpl_id;
            const attrName = Array.isArray(ptav.attribute_id) ? ptav.attribute_id[1] : "Unknown";

            if (typeof tmplId === 'number') {
                if (!attributesByTemplate.has(tmplId)) {
                    attributesByTemplate.set(tmplId, {});
                }
                const attrs = attributesByTemplate.get(tmplId)!;
                if (!attrs[attrName]) {
                    attrs[attrName] = [];
                }
                // Avoid duplicate values
                if (!attrs[attrName].includes(ptav.name)) {
                    attrs[attrName].push(ptav.name);
                }
            }
        }

        // Attach attributes to products
        return products.map(p => {
            const tmplId = Array.isArray(p.product_tmpl_id) ? p.product_tmpl_id[0] : p.product_tmpl_id;
            if (typeof tmplId === 'number' && attributesByTemplate.has(tmplId)) {
                return {
                    ...p,
                    attributes: attributesByTemplate.get(tmplId)
                };
            }
            return p;
        });
    }
}
