"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "—",
  searchPlaceholder = "...",
  disabled,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? "";

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch("");
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={cn(
          "w-full h-12 flex items-center justify-between gap-2",
          "bg-elite-cream/40 border border-elite-burgundy/15 rounded-2xl px-4",
          "text-sm font-cabin text-start",
          "focus:outline-none focus:ring-2 focus:ring-elite-burgundy/20",
          "disabled:opacity-50 transition-colors",
          selectedLabel ? "text-elite-black" : "text-elite-black/40",
        )}
      >
        <span className="flex-1 truncate">{selectedLabel || placeholder}</span>
        <svg
          className={cn(
            "w-4 h-4 text-elite-black/40 shrink-0 transition-transform duration-200",
            open && "rotate-180",
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-elite-burgundy/15 rounded-2xl shadow-lg overflow-hidden">
          <div className="px-3 pt-3 pb-2">
            <input
              ref={inputRef}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full h-10 bg-elite-cream/40 border border-elite-burgundy/10 rounded-xl px-3 text-sm font-cabin focus:outline-none focus:ring-1 focus:ring-elite-burgundy/20"
            />
          </div>
          <div className="max-h-56 overflow-y-auto overscroll-contain pb-1.5">
            {filtered.length === 0 && (
              <p className="text-sm text-elite-black/40 font-cabin text-center py-4">
                —
              </p>
            )}
            {filtered.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                  setSearch("");
                }}
                className={cn(
                  "w-full text-start px-4 py-2.5 text-sm font-cabin transition-colors",
                  "hover:bg-elite-cream/60 active:bg-elite-cream",
                  option.value === value
                    ? "text-elite-burgundy font-medium bg-elite-burgundy/5"
                    : "text-elite-black/80",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
