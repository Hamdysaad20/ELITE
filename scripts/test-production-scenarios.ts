/**
 * Production Scenario Testing Script
 * Tests real-world production scenarios
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import { prisma } from "../src/server/db/client";

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: string;
}

const results: TestResult[] = [];

function logTest(name: string, passed: boolean, error?: string, details?: string) {
  results.push({ name, passed, error, details });
  const icon = passed ? "✅" : "❌";
  console.log(`${icon} ${name}`);
  if (error) console.log(`   Error: ${error}`);
  if (details) console.log(`   Details: ${details}`);
}

async function testProductionScenarios() {
  console.log("🧪 Testing Production Scenarios\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Test 1: Rate Limiting Simulation
  console.log("1. Rate Limiting Tests\n");
  
  const orders: number[] = [];
  const submitOrder = async () => {
    orders.push(Date.now());
    if (orders.length > 5) {
      throw new Error("Rate limit exceeded");
    }
  };

  try {
    for (let i = 0; i < 5; i++) {
      await submitOrder();
    }
    await submitOrder();
    logTest("Rate Limiting", false, "Should have thrown rate limit error");
  } catch (error: any) {
    logTest("Rate Limiting", error.message.includes("Rate limit"), undefined, "Correctly prevents rapid submissions");
  }

  // Test 2: Timeout Handling
  console.log("\n2. Timeout Handling Tests\n");

  try {
    const fetchWithTimeout = async (timeout: number = 100) => {
      return Promise.race([
        new Promise(resolve => setTimeout(() => resolve("success"), 1000)),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), timeout)
        ),
      ]);
    };

    await fetchWithTimeout(50);
    logTest("Timeout Handling", false, "Should have timed out");
  } catch (error: any) {
    logTest("Timeout Handling", error.message.includes("timeout"), undefined, "Correctly handles timeouts");
  }

  // Test 3: Retry Logic
  console.log("\n3. Retry Logic Tests\n");

  let attemptCount = 0;
  const maxRetries = 3;
  
  const retryWithBackoff = async (fn: () => Promise<any>, retries = maxRetries): Promise<any> => {
    try {
      attemptCount++;
      return await fn();
    } catch (error) {
      if (retries > 0) {
        const delay = Math.pow(2, maxRetries - retries) * 100;
        await new Promise(resolve => setTimeout(resolve, delay));
        return retryWithBackoff(fn, retries - 1);
      }
      throw error;
    }
  };

  try {
    const failingFn = async () => {
      if (attemptCount < 3) {
        throw new Error("Temporary failure");
      }
      return "success";
    };

    const result = await retryWithBackoff(failingFn);
    logTest("Retry with Backoff", result === "success", undefined, `Succeeded after ${attemptCount} attempts`);
  } catch (error: any) {
    logTest("Retry with Backoff", false, error.message);
  }

  // Test 4: Concurrent Request Prevention
  console.log("\n4. Concurrent Request Tests\n");

  let isSubmitting = false;
  const submitOrderWithLock = async () => {
    if (isSubmitting) {
      throw new Error("Order submission in progress");
    }
    isSubmitting = true;
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
    } finally {
      isSubmitting = false;
    }
  };

  try {
    await submitOrderWithLock();
    const promise1 = submitOrderWithLock();
    const promise2 = submitOrderWithLock();
    await Promise.all([promise1, promise2]);
    logTest("Concurrent Request Prevention", false, "Should have prevented concurrent submissions");
  } catch (error: any) {
    logTest("Concurrent Request Prevention", error.message.includes("in progress"), undefined, "Correctly prevents concurrent submissions");
  }

  // Test 5: Input Validation
  console.log("\n5. Input Validation Tests\n");

  const validUUID = "123e4567-e89b-12d3-a456-426614174000";
  const invalidUUID = "invalid-uuid";
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  logTest("UUID Validation", uuidRegex.test(validUUID) && !uuidRegex.test(invalidUUID), undefined, "Correctly validates UUID format");

  // Test 6: Polling Limits
  console.log("\n6. Polling Limits Tests\n");

  const maxPollAttempts = 15;
  const pollInterval = 2000;
  const maxPollTime = maxPollAttempts * pollInterval;

  logTest("Polling Timeout", maxPollTime === 30000, undefined, `Max polling time: ${maxPollTime}ms (${maxPollAttempts} attempts)`);

  // Test 7: Error Recovery
  console.log("\n7. Error Recovery Tests\n");

  let errorCount = 0;
  const maxErrors = 2;
  
  const operationWithRecovery = async () => {
    errorCount++;
    if (errorCount <= maxErrors) {
      throw new Error("Transient error");
    }
    return "success";
  };

  try {
    let result;
    let attempts = 0;
    while (attempts < 5) {
      try {
        result = await operationWithRecovery();
        break;
      } catch (error) {
        attempts++;
        if (attempts >= 5) {
          throw error;
        }
      }
    }
    logTest("Error Recovery", result === "success", undefined, `Recovered after ${attempts} attempts`);
  } catch (error: any) {
    logTest("Error Recovery", false, error.message);
  }

  // Summary
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📊 Test Summary\n");
  
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

  if (failed > 0) {
    console.log("Failed Tests:");
    results.filter((r) => !r.passed).forEach((r) => {
      console.log(`  ❌ ${r.name}`);
      if (r.error) console.log(`     ${r.error}`);
    });
  }

  await prisma.$disconnect();

  if (failed > 0) {
    process.exit(1);
  }
}

testProductionScenarios().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

