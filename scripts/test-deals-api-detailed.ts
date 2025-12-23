import { config } from "dotenv";

// Load environment variables
config();

/**
 * Detailed test script for /api/deals endpoint
 * 
 * Tests:
 * - Basic API connectivity
 * - Response structure
 * - Deal data validation
 * - Error handling
 * - Edge cases
 * 
 * Run: npx tsx scripts/test-deals-api-detailed.ts
 */

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[36m",
  magenta: "\x1b[35m",
  cyan: "\x1b[34m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log("\n" + "=".repeat(70));
  log(title, "magenta");
  console.log("=".repeat(70));
}

function logTest(name: string, passed: boolean, details?: string) {
  const icon = passed ? "✅" : "❌";
  const color = passed ? "green" : "red";
  log(`${icon} ${name}`, color);
  if (details) {
    log(`   ${details}`, "blue");
  }
}

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

async function testApiEndpoint(url: string): Promise<TestResult> {
  try {
    log(`\nTesting: ${url}`, "cyan");
    const startTime = Date.now();
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    const duration = Date.now() - startTime;
    const status = response.status;
    const statusText = response.statusText;
    
    log(`Response: ${status} ${statusText} (${duration}ms)`, status === 200 ? "green" : "red");
    
    let body: any;
    const contentType = response.headers.get("content-type");
    
    if (contentType?.includes("application/json")) {
      body = await response.json();
    } else {
      const text = await response.text();
      log(`Response body (not JSON): ${text.substring(0, 200)}`, "yellow");
      return {
        name: "API Response",
        passed: false,
        error: `Expected JSON, got: ${contentType}`,
        details: { status, statusText, body: text.substring(0, 200) },
      };
    }
    
    if (status !== 200) {
      return {
        name: "API Response",
        passed: false,
        error: `HTTP ${status}: ${statusText}`,
        details: body,
      };
    }
    
    return {
      name: "API Response",
      passed: true,
      details: { status, duration, body },
    };
  } catch (error) {
    return {
      name: "API Response",
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function validateDealStructure(deal: any): TestResult {
  const requiredFields = ["id", "name", "pricelistId", "products", "active"];
  const missingFields: string[] = [];
  
  for (const field of requiredFields) {
    if (!(field in deal)) {
      missingFields.push(field);
    }
  }
  
  if (missingFields.length > 0) {
    return {
      name: "Deal Structure",
      passed: false,
      error: `Missing required fields: ${missingFields.join(", ")}`,
      details: deal,
    };
  }
  
  // Validate types
  if (typeof deal.id !== "string") {
    return {
      name: "Deal Structure",
      passed: false,
      error: `deal.id should be string, got ${typeof deal.id}`,
    };
  }
  
  if (typeof deal.name !== "string") {
    return {
      name: "Deal Structure",
      passed: false,
      error: `deal.name should be string, got ${typeof deal.name}`,
    };
  }
  
  if (typeof deal.pricelistId !== "number") {
    return {
      name: "Deal Structure",
      passed: false,
      error: `deal.pricelistId should be number, got ${typeof deal.pricelistId}`,
    };
  }
  
  if (!Array.isArray(deal.products)) {
    return {
      name: "Deal Structure",
      passed: false,
      error: `deal.products should be array, got ${typeof deal.products}`,
    };
  }
  
  if (typeof deal.active !== "boolean") {
    return {
      name: "Deal Structure",
      passed: false,
      error: `deal.active should be boolean, got ${typeof deal.active}`,
    };
  }
  
  return {
    name: "Deal Structure",
    passed: true,
    details: { dealId: deal.id, dealName: deal.name, productCount: deal.products.length },
  };
}

function validateProductStructure(product: any): TestResult {
  const requiredFields = [
    "id",
    "name",
    "originalPrice",
    "dealPrice",
    "dealActive",
    "savings",
    "savingsPercent",
  ];
  const missingFields: string[] = [];
  
  for (const field of requiredFields) {
    if (!(field in product)) {
      missingFields.push(field);
    }
  }
  
  if (missingFields.length > 0) {
    return {
      name: "Product Structure",
      passed: false,
      error: `Missing required fields: ${missingFields.join(", ")}`,
      details: product,
    };
  }
  
  // Validate price types and values
  if (typeof product.originalPrice !== "number" || product.originalPrice < 0) {
    return {
      name: "Product Structure",
      passed: false,
      error: `product.originalPrice should be non-negative number, got ${product.originalPrice}`,
    };
  }
  
  if (typeof product.dealPrice !== "number" || product.dealPrice < 0) {
    return {
      name: "Product Structure",
      passed: false,
      error: `product.dealPrice should be non-negative number, got ${product.dealPrice}`,
    };
  }
  
  if (product.dealPrice > product.originalPrice) {
    return {
      name: "Product Structure",
      passed: false,
      error: `product.dealPrice (${product.dealPrice}) should not exceed originalPrice (${product.originalPrice})`,
    };
  }
  
  if (typeof product.savings !== "number") {
    return {
      name: "Product Structure",
      passed: false,
      error: `product.savings should be number, got ${typeof product.savings}`,
    };
  }
  
  if (typeof product.savingsPercent !== "number" || product.savingsPercent < 0 || product.savingsPercent > 100) {
    return {
      name: "Product Structure",
      passed: false,
      error: `product.savingsPercent should be number between 0-100, got ${product.savingsPercent}`,
    };
  }
  
  // Validate savings calculation
  const expectedSavings = product.originalPrice - product.dealPrice;
  const savingsDiff = Math.abs(product.savings - expectedSavings);
  if (savingsDiff > 0.01) {
    return {
      name: "Product Structure",
      passed: false,
      error: `Savings calculation mismatch: expected ${expectedSavings}, got ${product.savings}`,
    };
  }
  
  const expectedPercent = product.originalPrice > 0
    ? ((product.originalPrice - product.dealPrice) / product.originalPrice) * 100
    : 0;
  const percentDiff = Math.abs(product.savingsPercent - expectedPercent);
  if (percentDiff > 0.1) {
    return {
      name: "Product Structure",
      passed: false,
      error: `Savings percent mismatch: expected ${expectedPercent.toFixed(1)}%, got ${product.savingsPercent.toFixed(1)}%`,
    };
  }
  
  return {
    name: "Product Structure",
    passed: true,
    details: {
      productId: product.id,
      productName: product.name,
      originalPrice: product.originalPrice,
      dealPrice: product.dealPrice,
      savings: product.savings,
      savingsPercent: product.savingsPercent,
    },
  };
}

async function runTests() {
  logSection("🧪 DETAILED DEALS API TEST SUITE");
  
  // Use localhost for local testing, or allow override via env
  const baseUrl = process.env.TEST_API_URL || "http://localhost:3000";
  const testUrl = `${baseUrl}/api/deals`;
  const testUrlWithInactive = `${baseUrl}/api/deals?includeInactive=true`;
  
  const results: TestResult[] = [];
  
  // Test 1: Basic API connectivity
  logSection("Test 1: Basic API Connectivity");
  const apiTest = await testApiEndpoint(testUrl);
  results.push(apiTest);
  logTest("API Endpoint Accessible", apiTest.passed, apiTest.error);
  
  if (!apiTest.passed) {
    log("\n❌ API test failed. Cannot continue with other tests.", "red");
    log(`Error: ${apiTest.error}`, "red");
    if (apiTest.details) {
      log(`Details: ${JSON.stringify(apiTest.details, null, 2)}`, "yellow");
    }
    process.exit(1);
  }
  
  const responseData = apiTest.details?.body;
  if (!responseData) {
    log("\n❌ No response data received.", "red");
    process.exit(1);
  }
  
  // Test 2: Response structure
  logSection("Test 2: Response Structure");
  if (!responseData.data) {
    logTest("Response has 'data' field", false, "Response missing 'data' field");
    results.push({ name: "Response Structure", passed: false, error: "Missing 'data' field" });
  } else {
    logTest("Response has 'data' field", true);
    results.push({ name: "Response Structure", passed: true });
    
    if (!responseData.data.deals) {
      logTest("Response has 'deals' array", false, "Response missing 'deals' array");
      results.push({ name: "Deals Array", passed: false, error: "Missing 'deals' array" });
    } else {
      logTest("Response has 'deals' array", true, `${responseData.data.deals.length} deal(s) found`);
      results.push({ name: "Deals Array", passed: true, details: { count: responseData.data.deals.length } });
    }
  }
  
  // Test 3: Deal structure validation
  if (responseData.data?.deals && Array.isArray(responseData.data.deals)) {
    logSection("Test 3: Deal Structure Validation");
    
    for (let i = 0; i < responseData.data.deals.length; i++) {
      const deal = responseData.data.deals[i];
      log(`\nValidating Deal ${i + 1}: ${deal.name || "Unknown"}`, "cyan");
      
      const dealValidation = validateDealStructure(deal);
      results.push(dealValidation);
      logTest(dealValidation.name, dealValidation.passed, dealValidation.error);
      
      if (dealValidation.passed && deal.products && Array.isArray(deal.products)) {
        log(`  Products: ${deal.products.length}`, "blue");
        
        // Validate first 3 products as sample
        const sampleSize = Math.min(3, deal.products.length);
        for (let j = 0; j < sampleSize; j++) {
          const product = deal.products[j];
          const productValidation = validateProductStructure(product);
          results.push(productValidation);
          logTest(`  Product ${j + 1}: ${product.name}`, productValidation.passed, productValidation.error);
          
          if (productValidation.passed && productValidation.details) {
            const details = productValidation.details;
            log(`    Original: ${details.originalPrice} EGP → Deal: ${details.dealPrice} EGP`, "blue");
            log(`    Savings: ${details.savings.toFixed(2)} EGP (${details.savingsPercent.toFixed(1)}%)`, "blue");
          }
        }
        
        if (deal.products.length > sampleSize) {
          log(`  ... and ${deal.products.length - sampleSize} more products`, "blue");
        }
      }
    }
  }
  
  // Test 4: Test with includeInactive parameter
  logSection("Test 4: includeInactive Parameter");
  const inactiveTest = await testApiEndpoint(testUrlWithInactive);
  results.push(inactiveTest);
  logTest("includeInactive Parameter", inactiveTest.passed, inactiveTest.error);
  
  if (inactiveTest.passed && inactiveTest.details?.body?.data?.deals) {
    const inactiveDeals = inactiveTest.details.body.data.deals;
    const activeCount = inactiveDeals.filter((d: any) => d.active).length;
    const inactiveCount = inactiveDeals.length - activeCount;
    log(`  Active deals: ${activeCount}`, "blue");
    log(`  Inactive deals: ${inactiveCount}`, "blue");
  }
  
  // Test 5: Edge cases
  logSection("Test 5: Edge Cases");
  
  // Test invalid URL
  const invalidUrlTest = await testApiEndpoint(`${baseUrl}/api/deals/invalid`);
  logTest("Invalid Endpoint Handling", invalidUrlTest.passed || invalidUrlTest.details?.status === 404, 
    invalidUrlTest.details?.status === 404 ? "Correctly returns 404" : invalidUrlTest.error);
  
  // Summary
  logSection("📊 TEST SUMMARY");
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  
  log(`Total Tests: ${total}`, "cyan");
  log(`✅ Passed: ${passed}`, "green");
  log(`❌ Failed: ${failed}`, failed > 0 ? "red" : "green");
  log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`, passed === total ? "green" : "yellow");
  
  if (failed > 0) {
    log("\n❌ Failed Tests:", "red");
    results.filter(r => !r.passed).forEach(result => {
      log(`  - ${result.name}: ${result.error}`, "red");
    });
    process.exit(1);
  } else {
    log("\n✅ All tests passed!", "green");
    process.exit(0);
  }
}

runTests().catch((error) => {
  log(`\n❌ Fatal error: ${error}`, "red");
  console.error(error);
  process.exit(1);
});

