"use client";
import { useState, useCallback } from "react";
import {
  useDrinkSuggestion,
  type DrinkPreferences,
} from "@/hooks/useDrinkSuggestion";
import { useCart } from "@/hooks/useCart";
import { Button, Input, LoadingOverlay } from "@/components/ui";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { ShoppingCart } from "lucide-react";
import { useOrdering } from "@/context/OrderingContext";
import { useLocalCart, type LocalCartItem } from "@/hooks/useLocalCart";

const FormField = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm text-elite-gray font-medium">{label}</label>
    {children}
  </div>
);

export default function DrinkSuggester() {
  const { loading, error, result, suggest } = useDrinkSuggestion();
  const { addToCart } = useCart();
  const { orderingEnabled } = useOrdering();
  const { addItem: addLocalItem } = useLocalCart();
  const [prefs, setPrefs] = useState<DrinkPreferences>({
    temperature: "either",
    caffeine: "medium",
    sweetness: "medium",
    milk: "dairy",
  });
  const [flavorsText, setFlavorsText] = useState("");

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const flavors = flavorsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      await suggest({ ...prefs, flavors });
    },
    [flavorsText, prefs, suggest],
  );

  const handleAddToCart = useCallback(
    async (
      item: {
        id: string;
        name?: string;
        price?: number;
        images?: string[];
        flavors?: { name: string }[];
      },
      size: string | undefined,
      suggestedFlavor: string | undefined,
    ) => {
      const flavor = item.flavors?.some(
        (f: { name: string }) => f.name === suggestedFlavor,
      )
        ? suggestedFlavor
        : undefined;

      if (!orderingEnabled) {
        const attributes: LocalCartItem["attributes"] = {};
        if (size) {
          attributes.Size = [
            { valueId: 0, valueName: size, priceExtra: 0 },
          ];
        }
        if (flavor) {
          attributes.Flavor = [
            { valueId: 0, valueName: flavor, priceExtra: 0 },
          ];
        }
        const basePrice = typeof item.price === "number" ? item.price : 0;
        addLocalItem({
          productId: item.id,
          name: item.name || "Saved item",
          basePrice,
          quantity: 1,
          attributes,
          totalPrice: basePrice,
          image: item.images?.[0],
        });
        return;
      }

      await addToCart(item.id, 1, { size, flavor });
    },
    [addToCart, addLocalItem, orderingEnabled],
  );

  return (
    <div className="w-full max-w-2xl mx-auto p-4 border rounded-lg shadow-sm bg-white">
      <h3 className="text-xl font-semibold mb-3">AI Drink Suggestion</h3>
      <LoadingOverlay loading={loading} message="Finding your perfect drink...">
        <form
          onSubmit={onSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          <FormField label="Temperature">
            <select
              className="border rounded px-2 py-1"
              value={prefs.temperature}
              onChange={(e) =>
                setPrefs((p) => ({
                  ...p,
                  temperature: e.target
                    .value as DrinkPreferences["temperature"],
                }))
              }
            >
              <option value="either">Either</option>
              <option value="hot">Hot</option>
              <option value="iced">Iced</option>
            </select>
          </FormField>
          <FormField label="Caffeine">
            <select
              className="border rounded px-2 py-1"
              value={prefs.caffeine}
              onChange={(e) =>
                setPrefs((p) => ({
                  ...p,
                  caffeine: e.target.value as DrinkPreferences["caffeine"],
                }))
              }
            >
              <option value="none">None</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </FormField>
          <FormField label="Sweetness">
            <select
              className="border rounded px-2 py-1"
              value={prefs.sweetness}
              onChange={(e) =>
                setPrefs((p) => ({
                  ...p,
                  sweetness: e.target.value as DrinkPreferences["sweetness"],
                }))
              }
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </FormField>
          <FormField label="Milk">
            <select
              className="border rounded px-2 py-1"
              value={prefs.milk}
              onChange={(e) =>
                setPrefs((p) => ({
                  ...p,
                  milk: e.target.value as DrinkPreferences["milk"],
                }))
              }
            >
              <option value="dairy">Dairy</option>
              <option value="non-dairy">Non-Dairy</option>
              <option value="no-milk">No Milk</option>
            </select>
          </FormField>
          <FormField label="Flavor notes (comma separated)">
            <input
              className="border rounded px-2 py-1"
              placeholder="e.g. chocolate, vanilla, spice"
              value={flavorsText}
              onChange={(e) => setFlavorsText(e.target.value)}
            />
          </FormField>
          <FormField label="Budget (EGP)">
            <input
              type="number"
              className="border rounded px-2 py-1"
              placeholder="e.g. 70"
              value={prefs.budget ?? ""}
              onChange={(e) =>
                setPrefs((p) => ({
                  ...p,
                  budget: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
            />
          </FormField>
          <FormField label="Size preference">
            <select
              className="border rounded px-2 py-1"
              value={prefs.sizePreference ?? ""}
              onChange={(e) =>
                setPrefs((p) => ({
                  ...p,
                  sizePreference: (e.target.value || undefined) as
                    | DrinkPreferences["sizePreference"]
                    | undefined,
                }))
              }
            >
              <option value="">Auto</option>
              <option value="Small">Small</option>
              <option value="Medium">Medium</option>
              <option value="Large">Large</option>
            </select>
          </FormField>
          <div className="md:col-span-2 flex items-center gap-3 mt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              disabled={loading}
            >
              Suggest a Drink
            </Button>
            {error && <span className="text-red-600 text-sm">{error}</span>}
          </div>
        </form>

        {result && (
          <div className="mt-6 space-y-4">
            <div>
              <h4 className="font-semibold">Top Pick</h4>
              <div className="flex gap-3 items-center mt-2">
                {result.recommendation.item.images?.[0] && (
                  <OptimizedImage
                    src={result.recommendation.item.images[0]}
                    alt={result.recommendation.item.name}
                    width={64}
                    height={64}
                    className="rounded"
                  />
                )}
                <div>
                  <div className="font-medium">
                    {result.recommendation.item.name}{" "}
                    {result.recommendation.suggestedSize
                      ? `• ${result.recommendation.suggestedSize}`
                      : ""}
                  </div>
                  <div className="text-xs text-gray-600">
                    {result.recommendation.reasons.join(" • ")}
                  </div>
                </div>
                <div className="ml-auto">
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<ShoppingCart className="w-3 h-3" />}
                    onClick={() =>
                      handleAddToCart(
                        result.recommendation.item,
                        result.recommendation.suggestedSize,
                        result.recommendation.suggestedFlavors?.[0],
                      )
                    }
                  >
                    {orderingEnabled ? "Add to Cart" : "Save for later"}
                  </Button>
                </div>
              </div>
            </div>
            {result.alternatives.length > 0 && (
              <div>
                <h4 className="font-semibold">Alternatives</h4>
                <ul className="mt-2 space-y-2">
                  {result.alternatives.map((alt, idx) => (
                    <li key={idx} className="flex gap-3 items-center">
                      {alt.item.images?.[0] && (
                        <OptimizedImage
                          src={alt.item.images[0]}
                          alt={alt.item.name}
                          width={48}
                          height={48}
                          className="rounded"
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium">
                          {alt.item.name}{" "}
                          {alt.suggestedSize ? `• ${alt.suggestedSize}` : ""}
                        </div>
                        <div className="text-xs text-gray-600">
                          {alt.reasons.join(" • ")}
                        </div>
                      </div>
                      <div className="ml-auto">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            handleAddToCart(
                              alt.item,
                              alt.suggestedSize,
                              alt.suggestedFlavors?.[0],
                            )
                          }
                        >
                          {orderingEnabled ? "Add" : "Save"}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </LoadingOverlay>
    </div>
  );
}
