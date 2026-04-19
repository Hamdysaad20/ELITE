"use client";

import { useState, useEffect } from "react";

interface InventoryItem {
  id: string;
  name: string;
  nameAr: string;
  section: string;
  subsection: string | null;
  unit: string;
  unitAr: string;
  countMethod: string;
  packSize: number;
  isDailyBarCounted: boolean;
  isStorageCounted: boolean;
  sortOrder: number;
  minimumStock: number;
  alertLevel: number;
  maximumStock: number;
}

interface GroupedItems {
  section: string;
  items: InventoryItem[];
}

export function useInventoryItems(location?: "bar" | "storage") {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [grouped, setGrouped] = useState<GroupedItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (location) params.set("location", location);

    fetch(`/api/admin/inventory-items?${params}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load items");
        const json = await res.json();
        const data = json.data as InventoryItem[];
        setItems(data);

        const sections = new Map<string, InventoryItem[]>();
        for (const item of data) {
          const list = sections.get(item.section) || [];
          list.push(item);
          sections.set(item.section, list);
        }
        setGrouped(
          Array.from(sections.entries()).map(([section, items]) => ({
            section,
            items,
          })),
        );
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [location]);

  return { items, grouped, loading, error };
}

export type { InventoryItem, GroupedItems };
