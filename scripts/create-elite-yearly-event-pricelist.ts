import { config } from "dotenv";
import { createOdooClient } from "@/server/utils/odooClient";

// Load environment variables
config();

/**
 * Script to create Elite Yearly University Event pricelist in Odoo
 * 
 * This script:
 * 1. Creates pricelist "Elite Yearly University Event"
 * 2. Sets global 25% discount for all products
 * 3. Sets date range for June 1st (annually)
 * 
 * Note: Update date range each year manually or via script
 * 
 * Run: npx tsx scripts/create-elite-yearly-event-pricelist.ts
 */

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[36m",
  magenta: "\x1b[35m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log("\n" + "=".repeat(60));
  log(title, "magenta");
  console.log("=".repeat(60));
}

const PRICELIST_NAME = "Elite Yearly University Event";
const DISCOUNT_PERCENT = 25; // Global 25% discount
const EVENT_MONTH = 6; // June
const EVENT_DAY = 1;

function getEventDates(year: number): { dateFrom: string; dateTo: string } {
  const dateFrom = `${year}-${EVENT_MONTH.toString().padStart(2, '0')}-${EVENT_DAY.toString().padStart(2, '0')}`;
  // End date must be after start date, so use next day
  const dateTo = `${year}-${EVENT_MONTH.toString().padStart(2, '0')}-${(EVENT_DAY + 1).toString().padStart(2, '0')}`;
  return { dateFrom, dateTo };
}

async function createOrFindPricelist(client: any, year: number): Promise<number> {
  const existing = await client.searchRead<any>(
    "product.pricelist",
    [["name", "=", PRICELIST_NAME]],
    ["id", "name", "active"]
  );
  
  if (existing && existing.length > 0) {
    const pricelist = existing[0];
    log(`✅ Found existing pricelist: ${pricelist.name} (ID: ${pricelist.id})`, "green");
    
    await client.rpc("product.pricelist", "write", [[pricelist.id], {
      active: true,
    }]);
    
    return pricelist.id;
  }
  
  log(`Creating new pricelist: ${PRICELIST_NAME}`, "blue");
  
  const pricelistId = await client.rpc<number>("product.pricelist", "create", [{
    name: PRICELIST_NAME,
    active: true,
  }]);
  
  log(`✅ Created pricelist: ${PRICELIST_NAME} (ID: ${pricelistId})`, "green");
  
  return pricelistId;
}

async function createGlobalRule(
  client: any,
  pricelistId: number,
  dateFrom: string,
  dateTo: string
): Promise<void> {
  // Delete existing rules
  const existingRules = await client.searchRead<any>(
    "product.pricelist.item",
    [["pricelist_id", "=", pricelistId]],
    ["id"]
  );
  
  if (existingRules && existingRules.length > 0) {
    const ruleIds = existingRules.map((r: any) => r.id);
    await client.rpc("product.pricelist.item", "unlink", [ruleIds]);
    log(`✅ Removed ${ruleIds.length} existing rule(s)`, "blue");
  }
  
  // Create global percentage rule (no product_id or categ_id = applies to all)
  await client.rpc("product.pricelist.item", "create", [{
    pricelist_id: pricelistId,
    compute_price: "percentage",
    percent_price: -DISCOUNT_PERCENT, // Negative for discount
    date_start: dateFrom,
    date_end: dateTo,
  }]);
  
  log(`✅ Created global rule: ${DISCOUNT_PERCENT}% discount on all products`, "green");
  log(`   Date range: ${dateFrom} to ${dateTo}`, "blue");
}

async function main() {
  logSection("🎓 ELITE YEARLY UNIVERSITY EVENT PRICELIST SETUP");
  
  try {
    const client = createOdooClient();
    if (!client) {
      log("❌ Odoo client not configured", "red");
      process.exit(1);
    }
    
    log("Testing Odoo connection...", "blue");
    const pingResult = await client.ping();
    log(`✅ Connected to Odoo (User ID: ${pingResult.uid})`, "green");
    
    // Get current year and next year for date ranges
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    
    log(`\nSetting up event for ${currentYear} and ${nextYear}...`, "blue");
    
    // Create/update pricelist
    const pricelistId = await createOrFindPricelist(client, currentYear);
    
    // Create rules for current year and next year
    const { dateFrom: dateFrom2025, dateTo: dateTo2025 } = getEventDates(currentYear);
    const { dateFrom: dateFrom2026, dateTo: dateTo2026 } = getEventDates(nextYear);
    
    // Create rule for current year
    await createGlobalRule(client, pricelistId, dateFrom2025, dateTo2025);
    
    // Create rule for next year (if we want to set it up in advance)
    // Uncomment if you want to set up next year's event too
    // await createGlobalRule(client, pricelistId, dateFrom2026, dateTo2026);
    
    logSection("✅ SETUP COMPLETE");
    log(`Pricelist ID: ${pricelistId}`, "green");
    log(`Event Date: June ${EVENT_DAY} (annually)`, "green");
    log(`Discount: ${DISCOUNT_PERCENT}% (global)`, "green");
    log(`Date Range: ${dateFrom2025} to ${dateTo2025}`, "green");
    log(`\n💡 Update date range annually for the next year's event`, "yellow");
    log(`   Or run this script each year to update the dates.`, "yellow");
    
  } catch (error) {
    log(`❌ Error: ${error}`, "red");
    console.error(error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

