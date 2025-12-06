import { useState, useCallback } from "react";
import type { MenuItem } from "@/types";

export interface DrinkPreferences {
  temperature?: "hot" | "iced" | "either";
  caffeine?: "none" | "low" | "medium" | "high";
  sweetness?: "low" | "medium" | "high";
  milk?: "no-milk" | "dairy" | "non-dairy";
  flavors?: string[];
  budget?: number;
  sizePreference?: "Small" | "Medium" | "Large";
  featuredBoost?: boolean;
  timeOfDay?: "morning" | "afternoon" | "evening" | "any";
}

export interface SuggestionData {
  userId: string;
  recommendation: {
    item: MenuItem;
    suggestedSize?: string;
    suggestedFlavors?: string[];
    reasons: string[];
  };
  alternatives: Array<{
    item: MenuItem;
    suggestedSize?: string;
    suggestedFlavors?: string[];
    reasons: string[];
  }>;
  personalization?: {
    favorites: string[];
    usedHistory: boolean;
  };
}

export function useDrinkSuggestion() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SuggestionData | null>(null);

  const suggest = useCallback(async (prefs: DrinkPreferences) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for NextAuth
        body: JSON.stringify(prefs),
      });

      if (!res.ok) {
        throw new Error("Failed to get suggestion");
      }

      const json = await res.json();
      setResult(json.data as SuggestionData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, result, suggest };
}
