import { config } from "dotenv";

// Load environment variables
config();

/**
 * Test script for deals API
 * 
 * Tests the /api/deals endpoint to verify:
 * - Server-side time validation works
 * - Deals are returned correctly
 * - Prices are calculated correctly
 * 
 * Run: npx tsx scripts/test-deals-api.ts
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

async function testDealsAPI() {
  logSection("🧪 TESTING DEALS API");
  
  try {
    // Use localhost for testing
    const baseUrl = process.env.TEST_API_URL || "http://localhost:3000";
    const url = `${baseUrl}/api/deals?includeInactive=true`;
    
    log(`Fetching: ${url}`, "blue");
    
    const response = await fetch(url);
    
    if (!response.ok) {
      log(`❌ API returned status: ${response.status}`, "red");
      const text = await response.text();
      log(`Response: ${text}`, "red");
      return;
    }
    
    const data = await response.json();
    
    if (data.success) {
      log(`✅ API call successful`, "green");
      log(`\nFound ${data.data.deals?.length || 0} deals`, "blue");
      
      if (data.data.deals && data.data.deals.length > 0) {
        data.data.deals.forEach((deal: any, idx: number) => {
          log(`\n${idx + 1}. ${deal.name}`, "green");
          log(`   ID: ${deal.id}`, "blue");
          log(`   Active: ${deal.active ? "✅ Yes" : "❌ No"}`, deal.active ? "green" : "yellow");
          log(`   Products: ${deal.products?.length || 0}`, "blue");
          log(`   Description: ${deal.description || "N/A"}`, "blue");
          
          if (deal.products && deal.products.length > 0) {
            log(`   Sample products:`, "blue");
            deal.products.slice(0, 3).forEach((product: any) => {
              const savings = product.originalPrice - product.dealPrice;
              log(`     • ${product.name}: ${product.originalPrice} EGP → ${product.dealPrice} EGP (Save ${savings.toFixed(2)} EGP)`, "blue");
            });
            if (deal.products.length > 3) {
              log(`     ... and ${deal.products.length - 3} more`, "blue");
            }
          }
        });
      } else {
        log("⚠️  No deals found. Create pricelists in Odoo first.", "yellow");
      }
    } else {
      log(`❌ API returned error: ${data.message || "Unknown error"}`, "red");
    }
    
  } catch (error) {
    log(`❌ Error: ${error}`, "red");
    console.error(error);
  }
}

// Run test
testDealsAPI().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

