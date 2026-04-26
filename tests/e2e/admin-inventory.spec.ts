import { expect, test } from "@playwright/test";

const session = {
  user: {
    id: "manager-1",
    name: "Manager",
    email: "manager@example.com",
    role: "manager",
  },
  expires: "2099-01-01T00:00:00.000Z",
};

test.describe("admin inventory UI", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await page.route("**/api/auth/session", async (route) => {
      await route.fulfill({ json: session });
    });
  });

  test("edits inventory item ordering rules", async ({ page }) => {
    let patchPayload: unknown;

    await page.route("**/api/admin/inventory-items?**", async (route) => {
      await route.fulfill({
        json: {
          success: true,
          data: [
            {
              id: "00000000-0000-0000-0000-000000000001",
              name: "Passion Fruit",
              nameAr: "باشن فروت",
              section: "syrups_sauces",
              subsection: "syrup",
              unit: "bottle",
              unitAr: "زجاجة",
              countMethod: "direct",
              packSize: 1,
              isDailyBarCounted: true,
              isStorageCounted: true,
              sortOrder: 1,
              minimumStock: 0,
              alertLevel: 0,
              maximumStock: 6,
              backupThreshold: 1,
              preferredSupplier: null,
              ruleChangeLogs: [],
            },
          ],
        },
      });
    });
    await page.route("**/api/admin/inventory-items", async (route) => {
      if (route.request().method() === "PATCH") {
        patchPayload = route.request().postDataJSON();
        await route.fulfill({ json: { success: true, data: {} } });
        return;
      }
      await route.continue();
    });

    await page.goto("/en/admin/inventory/items");
    await page.getByRole("button", { name: /Passion Fruit/i }).click();
    await page.getByRole("spinbutton", { name: "Min" }).fill("2");
    await page.getByRole("spinbutton", { name: "Backup" }).fill("0.5");
    await page.getByLabel("Supplier").fill("Syrups Supplier");
    await page.getByLabel("Change reason").fill("Configured thresholds");
    await page.getByRole("button", { name: "Save" }).click();

    expect(patchPayload).toMatchObject({
      itemId: "00000000-0000-0000-0000-000000000001",
      minimumStock: 2,
      backupThreshold: 0.5,
      preferredSupplier: "Syrups Supplier",
      reason: "Configured thresholds",
    });
  });

  test("dashboard filters stock by status and actionable flags", async ({ page }) => {
    const requestedUrls: string[] = [];

    await page.route("**/api/admin/stock?**", async (route) => {
      requestedUrls.push(route.request().url());
      await route.fulfill({
        json: {
          success: true,
          data: {
            totalItems: 1,
            suppliers: ["Syrups Supplier"],
            alerts: [],
            levels: [],
          },
        },
      });
    });
    await page.route("**/api/admin/transfers", async (route) =>
      route.fulfill({ json: { success: true, data: [] } }),
    );
    await page.route("**/api/admin/waste", async (route) =>
      route.fulfill({ json: { success: true, data: [] } }),
    );
    await page.route("**/api/admin/inventory?**", async (route) =>
      route.fulfill({ json: { success: true, data: [] } }),
    );

    await page.goto("/en/admin/dashboard");
    await page.getByLabel("Actionable only").check();
    await page.getByLabel("Missing minimum").check();
    await page.getByRole("combobox").first().selectOption("backup_order");

    await expect
      .poll(() => requestedUrls.some((url) => url.includes("actionable=true")))
      .toBe(true);
    expect(requestedUrls.some((url) => url.includes("missingMinimum=true"))).toBe(
      true,
    );
    expect(requestedUrls.some((url) => url.includes("status=backup_order"))).toBe(
      true,
    );
  });
});
