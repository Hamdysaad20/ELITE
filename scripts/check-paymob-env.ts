/**
 * Quick script to check Paymob environment variables
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

console.log("Checking Paymob environment variables:\n");

const vars = [
  "PAYMOB_API_KEY",
  "PAYMOB_SECRET_KEY",
  "PAYMOB_PUBLIC_KEY",
  "PAYMOB_HMAC_SECRET",
  "PAYMOB_INTEGRATION_ID",
  "PAYMOB_WALLET_INTEGRATION_ID",
  "PAYMOB_ENVIRONMENT",
];

vars.forEach((varName) => {
  const value = process.env[varName];
  if (value) {
    const masked = value.substring(0, 8) + "..." + value.substring(value.length - 4);
    console.log(`✅ ${varName}: ${masked} (${value.length} chars)`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
  }
});

