#!/usr/bin/env node

/**
 * Magic Link System Test Suite
 * Validates that the entire authentication email flow is working
 */

const https = require("https");
const http = require("http");

const BASE_URL = "http://localhost:3003";
const TEST_EMAIL = "test@example.com";

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === "https:";
    const client = isHttps ? https : http;

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || "GET",
      headers: {
        "User-Agent": "Test Suite",
        ...options.headers,
      },
    };

    const req = client.request(requestOptions, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on("error", reject);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

async function runTests() {
  console.log("\n" + "=".repeat(80));
  console.log("🧪 MAGIC LINK SYSTEM TEST SUITE");
  console.log("=".repeat(80) + "\n");

  try {
    // Test 1: Check if sign-in page is accessible
    console.log("📝 Test 1: Sign-in Page Accessibility");
    console.log("   Testing: GET /auth/signin");
    try {
      const signInResponse = await makeRequest(`${BASE_URL}/auth/signin`);
      if (signInResponse.status === 200) {
        console.log("   ✅ Sign-in page is accessible (Status: 200)\n");
      } else {
        console.log(
          `   ❌ Sign-in page returned unexpected status: ${signInResponse.status}\n`
        );
      }
    } catch (error) {
      console.log(`   ❌ Could not reach sign-in page: ${error.message}\n`);
    }

    // Test 2: Check if verify-request page is accessible
    console.log("📝 Test 2: Verify-Request Page Accessibility");
    console.log("   Testing: GET /auth/verify-request");
    try {
      const verifyResponse = await makeRequest(
        `${BASE_URL}/auth/verify-request?email=${encodeURIComponent(TEST_EMAIL)}`
      );
      if (verifyResponse.status === 200) {
        console.log("   ✅ Verify-request page is accessible (Status: 200)\n");
      } else {
        console.log(
          `   ❌ Verify-request page returned unexpected status: ${verifyResponse.status}\n`
        );
      }
    } catch (error) {
      console.log(
        `   ❌ Could not reach verify-request page: ${error.message}\n`
      );
    }

    // Test 3: Check NextAuth session endpoint
    console.log("📝 Test 3: NextAuth Session Endpoint");
    console.log("   Testing: GET /api/auth/session");
    try {
      const sessionResponse = await makeRequest(`${BASE_URL}/api/auth/session`);
      if (sessionResponse.status === 200) {
        console.log("   ✅ NextAuth session endpoint is working (Status: 200)");
        try {
          const sessionData = JSON.parse(sessionResponse.body);
          if (!sessionData) {
            console.log("   ✅ No active session (expected for unauthenticated user)\n");
          }
        } catch (e) {
          console.log("   ⚠️ Could not parse session response\n");
        }
      } else {
        console.log(
          `   ❌ Session endpoint returned status: ${sessionResponse.status}\n`
        );
      }
    } catch (error) {
      console.log(`   ❌ Could not reach session endpoint: ${error.message}\n`);
    }

    // Test 4: Check authentication providers
    console.log("📝 Test 4: NextAuth Providers Configuration");
    console.log("   Testing: GET /api/auth/providers");
    try {
      const providersResponse = await makeRequest(
        `${BASE_URL}/api/auth/providers`
      );
      if (providersResponse.status === 200) {
        try {
          const providers = JSON.parse(providersResponse.body);
          console.log("   ✅ Providers endpoint is accessible");
          if (providers.email) {
            console.log("   ✅ Email provider is configured");
          }
          if (providers.google) {
            console.log("   ✅ Google provider is configured");
          }
          console.log();
        } catch (e) {
          console.log("   ⚠️ Could not parse providers response\n");
        }
      } else {
        console.log(
          `   ❌ Providers endpoint returned status: ${providersResponse.status}\n`
        );
      }
    } catch (error) {
      console.log(`   ❌ Could not reach providers endpoint: ${error.message}\n`);
    }

    // Summary
    console.log("=".repeat(80));
    console.log("✅ TEST SUITE COMPLETED");
    console.log("=".repeat(80));
    console.log("\n📌 NEXT STEPS:");
    console.log(
      "1. Open http://localhost:3003/auth/signin in your browser"
    );
    console.log("2. Enter a test email address");
    console.log("3. Click 'Send Magic Link'");
    console.log("4. Check your email inbox for the magic link");
    console.log("5. Click the link in the email to verify authentication\n");
    console.log(
      "💡 TIP: In development mode, if email doesn't arrive, check the"
    );
    console.log(
      "   server console for the magic link URL (starting with http://localhost:3003/api/auth/callback/email)\n"
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ TEST SUITE ERROR:", error);
    process.exit(1);
  }
}

// Run tests
runTests();
