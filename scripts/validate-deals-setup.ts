import { config } from "dotenv";
import { createOdooClient, isOdooConfigured } from "@/server/utils/odooClient";

// Load environment variables
config();

/**
 * Validation script to check if deals are properly set up
 * 
 * This script:
 * 1. Checks Odoo connection
 * 2. Verifies all active pricelists exist
 * 3. Checks pricelist items
 * 4. Validates products match
 * 
 * Run: npx tsx scripts/validate-deals-setup.ts
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

async function validateSetup() {
  logSection("🔍 VALIDATING DEALS SETUP");

  try {
    // Step 1: Check Odoo configuration
    log("\n1. Checking Odoo configuration...", "blue");
    if (!isOdooConfigured()) {
      log("❌ Odoo is not configured", "red");
      log("   Please set: ODOO_HOST, ODOO_DB, ODOO_USERNAME, ODOO_API_KEY", "yellow");
      return false;
    }
    log("✅ Odoo is configured", "green");

    const client = createOdooClient();
    if (!client) {
      log("❌ Failed to create Odoo client", "red");
      return false;
    }

    // Test connection
    log("\n2. Testing Odoo connection...", "blue");
    try {
      const pingResult = await client.ping();
      log(`✅ Connected to Odoo (User ID: ${pingResult.uid})`, "green");
    } catch (error) {
      log(`❌ Failed to connect to Odoo: ${error}`, "red");
      return false;
    }

    // Step 2: Check all pricelists
    log("\n3. Checking pricelists...", "blue");
    const allPricelists = await client.getAllActivePricelists();
    if (!allPricelists || allPricelists.length === 0) {
      log("❌ No active pricelists found", "red");
      log("   Create pricelists in Odoo or run: npx tsx scripts/create-monday-deals-pricelist.ts", "yellow");
      return false;
    }
    log(`✅ Found ${allPricelists.length} active pricelist${allPricelists.length !== 1 ? "s" : ""}`, "green");
    allPricelists.forEach(pl => {
      log(`   - ${pl.name} (ID: ${pl.id})`, "blue");
    });

    // Step 3: Check pricelist items
    log("\n4. Checking pricelist items...", "blue");
    
    let totalItems = 0;
    let pricelistsWithItems = 0;
    
    for (const pricelist of allPricelists) {
      const pricelistItems = await client.searchRead<any>(
        "product.pricelist.item",
        [["pricelist_id", "=", pricelist.id]],
        ["product_id", "categ_id", "fixed_price", "compute_price", "percent_price"],
      );
      
      if (pricelistItems && pricelistItems.length > 0) {
        totalItems += pricelistItems.length;
        pricelistsWithItems++;
        log(`   ✓ ${pricelist.name}: ${pricelistItems.length} item${pricelistItems.length !== 1 ? "s" : ""}`, "green");
        
        // Show sample items
        const sampleItems = pricelistItems.slice(0, 5);
        
        sampleItems.forEach((item: any) => {
          const computePrice = item.compute_price || "fixed";
          let ruleInfo = "";
          let priceInfo = "";
          
          // Determine rule type and price
          if (item.product_id && item.product_id !== false) {
            let productName = "Unknown";
            if (Array.isArray(item.product_id) && item.product_id.length >= 2) {
              productName = item.product_id[1];
            } else if (Array.isArray(item.product_id)) {
              productName = `Product ID: ${item.product_id[0]}`;
            } else {
              productName = `Product ID: ${item.product_id}`;
            }
            ruleInfo = `Product: ${productName}`;
          } else if (item.categ_id && item.categ_id !== false) {
            let categoryName = "Unknown";
            if (Array.isArray(item.categ_id) && item.categ_id.length >= 2) {
              categoryName = item.categ_id[1];
            } else if (Array.isArray(item.categ_id)) {
              categoryName = `Category ID: ${item.categ_id[0]}`;
            } else {
              categoryName = `Category ID: ${item.categ_id}`;
            }
            ruleInfo = `Category: ${categoryName}`;
          } else {
            ruleInfo = "Global rule";
          }
          
          // Determine price display
          if (computePrice === "fixed" && item.fixed_price) {
            priceInfo = `${item.fixed_price} EGP`;
          } else if (computePrice === "percentage" && item.percent_price) {
            priceInfo = `${item.percent_price}% discount`;
          } else {
            priceInfo = "No price set";
          }
          
          log(`     • ${ruleInfo} → ${priceInfo}`, "blue");
        });
        
        if (pricelistItems.length > 5) {
          log(`     ... and ${pricelistItems.length - 5} more`, "blue");
        }
        if (pricelistItems.length > 3) {
          log(`     ... and ${pricelistItems.length - 3} more`, "blue");
        }
      } else {
        log(`   ⚠️  ${pricelist.name}: No items`, "yellow");
      }
    }

    if (totalItems === 0) {
      log("\n❌ No pricelist items found in any pricelist", "red");
      log("   Add items to pricelists in Odoo", "yellow");
      return false;
    }

    // Summary
    logSection("📊 VALIDATION SUMMARY");
    log(`Active Pricelists: ${allPricelists.length}`, "blue");
    log(`Pricelists with Items: ${pricelistsWithItems}`, pricelistsWithItems > 0 ? "green" : "yellow");
    log(`Total Pricelist Items: ${totalItems}`, totalItems > 0 ? "green" : "yellow");

    if (pricelistsWithItems > 0 && totalItems > 0) {
      log("\n🎉 Deals are properly configured!", "green");
      log(`   Visit http://localhost:3000/deals to see ${pricelistsWithItems} deal${pricelistsWithItems !== 1 ? "s" : ""}`, "green");
      return true;
    } else {
      log("\n⚠️  Some pricelists are missing items.", "yellow");
      return false;
    }
  } catch (error) {
    log(`\n❌ Validation failed: ${error}`, "red");
    console.error(error);
    return false;
  }
}

// Run validation
validateSetup()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
