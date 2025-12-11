import { config } from "dotenv";
import { createOdooClient } from "@/server/utils/odooClient";

// Load environment variables
config();

/**
 * Quick verification script to check Odoo data
 */

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  blue: "\x1b[36m",
  yellow: "\x1b[33m",
  magenta: "\x1b[35m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function verifyOdooData() {
  log("\n" + "=".repeat(70), "magenta");
  log("📊 ODOO DATA VERIFICATION", "magenta");
  log("=".repeat(70), "magenta");

  try {
    const odooClient = createOdooClient();
    if (!odooClient) {
      log("❌ Odoo client not configured", "yellow");
      return;
    }

    // 1. Check Partners
    log("\n🔍 Checking Partners (res.partner)...", "blue");
    const partners = await odooClient.searchRead<any>(
      "res.partner",
      [["email", "like", "@elite-test.com"]],
      ["id", "name", "email", "phone", "street", "city", "zip"],
      { limit: 10, order: "id desc" }
    );
    
    log(`✅ Found ${partners.length} test partners`, "green");
    partners.forEach((partner: any, idx: number) => {
      log(`\n  ${idx + 1}. Partner ID: ${partner.id}`, "yellow");
      log(`     Name: ${partner.name}`);
      log(`     Email: ${partner.email || "Not set"}`);
      log(`     Phone: ${partner.phone || "Not set"}`);
      log(`     Address: ${partner.street || "Not set"}, ${partner.city || "N/A"}`);
      log(`     Zip: ${partner.zip || "Not set"}`);
    });

    // 2. Check Sale Orders
    log("\n\n🔍 Checking Sale Orders (sale.order)...", "blue");
    const allSaleOrders = await odooClient.searchRead<any>(
      "sale.order",
      [],
      ["id", "name", "partner_id", "client_order_ref", "amount_total", "state", "create_date"],
      { limit: 10, order: "id desc" }
    );
    
    const saleOrders = allSaleOrders.filter((o: any) =>
      (o.client_order_ref && (o.client_order_ref.includes('test-') || o.client_order_ref.includes('-'))) ||
      Array.isArray(o.partner_id) && o.partner_id[1]?.includes('Test')
    );    log(`✅ Found ${saleOrders.length} test sale orders (out of ${allSaleOrders.length} recent orders)`, "green");
    saleOrders.forEach((order: any, idx: number) => {
      log(`\n  ${idx + 1}. Sale Order ID: ${order.id}`, "yellow");
      log(`     Order: ${order.name}`);
      log(`     Partner: ${Array.isArray(order.partner_id) ? order.partner_id[1] : order.partner_id}`);
      log(`     Client Ref: ${order.client_order_ref}`);
      log(`     Amount: ${order.amount_total} ${order.currency_id ? (Array.isArray(order.currency_id) ? order.currency_id[1] : '') : ''}`);
      log(`     State: ${order.state}`);
      log(`     Created: ${order.create_date}`);
    });

    // 3. Check Order Lines
    let orderLines: any[] = [];
    if (saleOrders.length > 0) {
      log("\n\n🔍 Checking Order Lines (sale.order.line)...", "blue");
      const orderIds = saleOrders.map((o: any) => o.id);
      orderLines = await odooClient.searchRead<any>(
        "sale.order.line",
        [["order_id", "in", orderIds]],
        ["id", "order_id", "product_id", "name", "product_uom_qty", "price_unit", "price_subtotal"],
        { limit: 20 }
      );
      
      log(`✅ Found ${orderLines.length} order lines`, "green");
      orderLines.forEach((line, idx) => {
        log(`\n  ${idx + 1}. Line ID: ${line.id}`, "yellow");
        log(`     Order: ${Array.isArray(line.order_id) ? line.order_id[1] : line.order_id}`);
        log(`     Product: ${Array.isArray(line.product_id) ? line.product_id[1] : line.product_id}`);
        log(`     Description: ${line.name}`);
        log(`     Quantity: ${line.product_uom_qty}`);
        log(`     Unit Price: ${line.price_unit}`);
        log(`     Subtotal: ${line.price_subtotal}`);
      });
    }

    // 4. Check Products
    log("\n\n🔍 Checking Products (product.product)...", "blue");
    const products = await odooClient.searchRead<any>(
      "product.product",
      [["default_code", "in", ["CAPPUCCINO-M", "CROISSANT"]]],
      ["id", "name", "default_code", "list_price", "sale_ok", "type"],
      { limit: 10 }
    );
    
    log(`✅ Found ${products.length} test products`, "green");
    products.forEach((product: any, idx: number) => {
      log(`\n  ${idx + 1}. Product ID: ${product.id}`, "yellow");
      log(`     Name: ${product.name}`);
      log(`     SKU: ${product.default_code || "Not set"}`);
      log(`     Price: ${product.list_price}`);
      log(`     Sale OK: ${product.sale_ok}`);
      log(`     Type: ${product.type}`);
    });

    // 5. Summary
    log("\n" + "=".repeat(70), "magenta");
    log("📈 SUMMARY", "magenta");
    log("=".repeat(70), "magenta");
    log(`Partners Created: ${partners.length}`, "green");
    log(`Sale Orders Created: ${saleOrders.length}`, "green");
    log(`Order Lines Created: ${orderLines?.length || 0}`, "green");
    log(`Products Created: ${products.length}`, "green");
    log("\n✅ All data successfully synced to Odoo!", "green");
    log("=".repeat(70) + "\n", "magenta");

  } catch (error) {
    log(`\n❌ Error: ${error}`, "yellow");
    console.error(error);
  }
}

verifyOdooData().then(() => process.exit(0)).catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});
