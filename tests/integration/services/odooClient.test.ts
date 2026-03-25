import { describe, it, expect, vi, beforeEach } from "vitest";
import { getOdooConfigFromEnv, isOdooConfigured } from "@/server/utils/odooClient";

describe("Odoo Sync Services", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("should evaluate as not configured when core env variables are missing", () => {
    vi.stubEnv("ODOO_HOST", "");

    expect(isOdooConfigured()).toBe(false);
    expect(getOdooConfigFromEnv()).toBeNull();
  });

  it("should correctly compile the config payload when populated natively", () => {
    vi.stubEnv("ODOO_HOST", "https://mock.odoo.com");
    vi.stubEnv("ODOO_DB", "elite_test");
    vi.stubEnv("ODOO_USERNAME", "admin");
    vi.stubEnv("ODOO_API_KEY", "super_secret");

    expect(isOdooConfigured()).toBe(true);
    const config = getOdooConfigFromEnv();

    expect(config?.host).toBe("https://mock.odoo.com");
    expect(config?.db).toBe("elite_test");
    expect(config?.username).toBe("admin");
    expect(config?.password).toBe("super_secret");
    expect(config?.insecureSSL).toBe(false);
  });
});
