
import { syncProductsFromOdoo } from "../src/server/utils/syncProducts";
import path from "path";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { redisGet, redisDel } from "../src/server/cache/redis";

async function main() {
    console.log("Starting forced sync...");

    // Force clear lock to ensure we can run
    try {
        if (process.env.REDIS_URL) {
            await redisDel("sync:in_progress");
            console.log("Cleared sync lock");
        } else {
            console.warn("REDIS_URL not set in environment");
        }
    } catch (e) {
        console.warn("Failed to clear lock:", e);
    }

    const start = Date.now();
    try {
        const result = await syncProductsFromOdoo({ bypassCircuitBreaker: true });
        const end = Date.now();
        console.log(`Sync completed in ${(end - start) / 1000}s`);
        console.log("Result:", result);

        if (result.success) {
            // additional check: verify the size of products:all
            const productsAll = await redisGet<any[]>("products:all");
            console.log(`products:all count: ${productsAll?.length}`);

            if (productsAll && productsAll.length > 0) {
                const first = productsAll[0];
                console.log("Sample product properties:", Object.keys(first));
                console.log("Sample product images length:", first.images?.length);
                // check if thumbnail property is gone
                console.log("Has thumbnail property (should be undefined):", first.thumbnail);

                // Approximate size check
                const json = JSON.stringify(productsAll);
                console.log(`Approximate products:all size: ${(json.length / 1024 / 1024).toFixed(2)} MB`);
            }
        }
    } catch (error) {
        console.error("Sync failed:", error);
    }
    process.exit(0);
}

main();
