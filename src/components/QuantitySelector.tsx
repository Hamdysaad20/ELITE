"use client";

import { useState, useEffect } from "react";
import { Minus, Plus } from "lucide-react";

interface QuantitySelectorProps {
  value: number;
  onChange: (quantity: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export default function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 50,
  disabled = false,
}: QuantitySelectorProps) {
  const [inputValue, setInputValue] = useState(value.toString());

  // Sync input value when prop changes
  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleIncrement = () => {
    if (value < max && !disabled) {
      onChange(value + 1);
    }
  };

  const handleDecrement = () => {
    if (value > min && !disabled) {
      onChange(value - 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Allow empty string while typing
    if (newValue === '') {
      setInputValue('');
      return;
    }
    
    // Only allow numbers
    if (!/^\d+$/.test(newValue)) {
      return;
    }
    
    setInputValue(newValue);
  };

  const handleInputBlur = () => {
    let numValue = parseInt(inputValue, 10);
    
    // Handle invalid or empty input
    if (isNaN(numValue) || inputValue === '') {
      numValue = min;
    }
    
    // Clamp to min/max
    numValue = Math.max(min, Math.min(max, numValue));
    
    setInputValue(numValue.toString());
    onChange(numValue);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputBlur();
      e.currentTarget.blur();
    }
  };

  return (
    <div className="flex items-center gap-3">
      <span className="font-cabin text-elite-black/70 font-medium text-lg">Quantity:</span>
      <div className="flex items-center gap-2 bg-transparent rounded-xl border border-elite-burgundy/20 overflow-hidden">
        <button
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          className={`p-3 transition-all duration-300 ${
            disabled || value <= min
              ? "text-elite-black/20 cursor-not-allowed"
              : "text-elite-burgundy hover:bg-elite-burgundy/10 active:bg-elite-burgundy/20"
          }`}
          aria-label="Decrease quantity"
        >
          <Minus className="w-5 h-5" />
        </button>
        
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          disabled={disabled}
          className="w-16 text-center font-cabin font-bold text-xl text-elite-burgundy bg-transparent focus:outline-none focus:bg-elite-cream/50 transition-colors disabled:text-elite-black/30"
          aria-label="Quantity"
        />
        
        <button
          onClick={handleIncrement}
          disabled={disabled || value >= max}
          className={`p-3 transition-all duration-300 ${
            disabled || value >= max
              ? "text-elite-black/20 cursor-not-allowed"
              : "text-elite-burgundy hover:bg-elite-burgundy/10 active:bg-elite-burgundy/20"
          }`}
          aria-label="Increase quantity"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      
      {max && (
        <span className="font-cabin text-elite-black/40 text-base">
          Max: {max}
        </span>
      )}
    </div>
  );
}
