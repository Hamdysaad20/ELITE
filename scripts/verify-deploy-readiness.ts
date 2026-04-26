import { execFileSync } from "node:child_process";
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

const required = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "EMAIL_SERVER_HOST",
  "EMAIL_SERVER_USER",
  "EMAIL_SERVER_PASSWORD",
  "EMAIL_FROM",
];

const optionalNetworked = ["REDIS_URL", "ODOO_HOST", "ODOO_DB", "ODOO_USERNAME"];

let failed = false;

for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing required env: ${key}`);
    failed = true;
  }
}

for (const key of optionalNetworked) {
  if (!process.env[key]) {
    console.warn(`Optional integration env not set: ${key}`);
  }
}

try {
  execFileSync("npx", ["prisma", "migrate", "status"], {
    stdio: "inherit",
    env: process.env,
  });
} catch {
  failed = true;
}

if (failed) {
  console.error("Deploy readiness check failed.");
  process.exit(1);
}

console.log("Deploy readiness check passed.");
