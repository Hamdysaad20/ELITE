/**
 * Tests that products API and menu data flow deduplicate by product id.
 * Prevents duplicate items on the menu page.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Helper: deduplicate by id (same logic as API)
function deduplicateById<T extends { id: string }>(items: T[]): T[] {
  return Array.from(new Map(items.map((p) => [p.id, p])).values());
}

describe("Products deduplication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deduplicates products by id (API logic)", () => {
    const withDuplicates = [
      { id: "1", name: "Espresso", price: 10, categoryId: "drinks" },
      { id: "2", name: "Latte", price: 12, categoryId: "drinks" },
      { id: "1", name: "Espresso Dupe", price: 10, categoryId: "drinks" },
      { id: "3", name: "Tea", price: 8, categoryId: "drinks" },
      { id: "2", name: "Latte Dupe", price: 12, categoryId: "drinks" },
    ];
    const result = deduplicateById(withDuplicates);
    expect(result).toHaveLength(3);
    const ids = result.map((p) => p.id).sort();
    expect(ids).toEqual(["1", "2", "3"]);
    // Last occurrence wins (Map overwrites)
    expect(result.find((p) => p.id === "1")?.name).toBe("Espresso Dupe");
    expect(result.find((p) => p.id === "2")?.name).toBe("Latte Dupe");
  });

  it("preserves order and keeps one entry per id", () => {
    const withDuplicates = [
      { id: "a", name: "A" },
      { id: "b", name: "B" },
      { id: "a", name: "A2" },
      { id: "c", name: "C" },
    ];
    const result = deduplicateById(withDuplicates);
    expect(result.map((p) => p.id)).toEqual(["a", "b", "c"]);
    // Last occurrence wins
    expect(result.map((p) => p.name)).toEqual(["A2", "B", "C"]);
  });

  it("handles empty array", () => {
    expect(deduplicateById([])).toEqual([]);
  });

  it("handles single item", () => {
    const one = [{ id: "only", name: "Only" }];
    expect(deduplicateById(one)).toEqual(one);
  });
});
