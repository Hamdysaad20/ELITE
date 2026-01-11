"use client";

import { Check } from "lucide-react";

interface AttributeValue {
  id: number;
  name: string;
  priceExtra: number;
}

interface AttributeSelectorProps {
  label: string;
  values: AttributeValue[];
  selected: number | number[] | undefined;
  multiSelect: boolean;
  onChange: (selected: number | number[]) => void;
  required?: boolean;
}

export default function AttributeSelector({
  label,
  values,
  selected,
  multiSelect,
  onChange,
  required = false,
}: AttributeSelectorProps) {
  const handleSingleSelect = (valueId: number) => {
    onChange(valueId);
  };

  const handleMultiSelect = (valueId: number) => {
    const currentSelected = Array.isArray(selected) ? selected : [];

    if (currentSelected.includes(valueId)) {
      // Remove from selection
      onChange(currentSelected.filter((id) => id !== valueId));
    } else {
      // Add to selection
      onChange([...currentSelected, valueId]);
    }
  };

  const isSelected = (valueId: number): boolean => {
    if (Array.isArray(selected)) {
      return selected.includes(valueId);
    }
    return selected === valueId;
  };

  return (
    <div className="space-y-4">
      <h3 className="font-calistoga text-elite-burgundy text-2xl">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </h3>

      {multiSelect ? (
        // Multi-select: Checkboxes
        <div className="grid grid-cols-2 gap-3">
          {values.map((value) => {
            const selected = isSelected(value.id);
            return (
              <button
                key={value.id}
                onClick={() => handleMultiSelect(value.id)}
                className={`p-4 rounded-xl font-cabin font-medium transition-all duration-300 text-left relative ${
                  selected
                    ? "bg-elite-burgundy text-elite-cream shadow-lg ring-2 ring-elite-burgundy ring-offset-2"
                    : "bg-transparent text-elite-burgundy hover:bg-elite-burgundy hover:text-elite-cream border border-elite-burgundy/20"
                }`}
              >
                {/* Checkbox indicator */}
                <div className="flex items-start gap-3">
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                      selected
                        ? "bg-elite-cream text-elite-burgundy"
                        : "bg-elite-cream border-2 border-elite-burgundy/30"
                    }`}
                  >
                    {selected && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-lg">{value.name}</div>
                    {value.priceExtra > 0 && (
                      <div className="text-sm mt-1 opacity-90">
                        +{value.priceExtra} EGP
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        // Single-select: Radio buttons
        <div className="grid grid-cols-3 gap-3">
          {values.map((value) => {
            const selected = isSelected(value.id);
            return (
              <button
                key={value.id}
                onClick={() => handleSingleSelect(value.id)}
                className={`p-4 rounded-xl font-cabin font-medium transition-all duration-300 text-center ${
                  selected
                    ? "bg-elite-burgundy text-elite-cream shadow-lg scale-105"
                    : "bg-transparent text-elite-burgundy hover:bg-elite-burgundy hover:text-elite-cream border border-elite-burgundy/20"
                }`}
              >
                <div className="font-bold text-lg">{value.name}</div>
                {value.priceExtra !== 0 && (
                  <div className="text-sm mt-1 opacity-90">
                    {value.priceExtra > 0 ? "+" : ""}
                    {value.priceExtra} EGP
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
