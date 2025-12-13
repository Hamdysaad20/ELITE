"use client";

import { useState } from "react";
import { Filter, X, Calendar, DollarSign, Package, ArrowUpDown } from "lucide-react";

export interface OrderFilters {
  status: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
    preset: 'today' | 'week' | 'month' | 'year' | 'all' | 'custom';
  };
  orderType: 'delivery' | 'pickup' | 'all';
  priceRange: {
    min: number;
    max: number;
  };
  sortBy: 'date' | 'price' | 'savings' | 'points';
  sortOrder: 'asc' | 'desc';
}

interface OrderFiltersProps {
  filters: OrderFilters;
  onFilterChange: (filters: OrderFilters) => void;
  orderCount: number;
}

const statusOptions = [
  { value: 'PENDING', label: 'Pending', color: 'elite-burgundy' },
  { value: 'CONFIRMED', label: 'Confirmed', color: 'elite-burgundy' },
  { value: 'PREPARING', label: 'Preparing', color: 'elite-burgundy' },
  { value: 'READY', label: 'Ready', color: 'elite-burgundy' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', color: 'elite-burgundy' },
  { value: 'DELIVERED', label: 'Delivered', color: 'elite-burgundy' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'elite-black' },
];

const datePresets = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'all', label: 'All Time' },
];

const sortOptions = [
  { value: 'date', label: 'Date' },
  { value: 'price', label: 'Price' },
  { value: 'savings', label: 'Savings' },
  { value: 'points', label: 'Points' },
];

export function OrderFilters({ filters, onFilterChange, orderCount }: OrderFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleStatusToggle = (status: string) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    
    onFilterChange({ ...filters, status: newStatus });
  };

  const handleDatePreset = (preset: typeof filters.dateRange.preset) => {
    const now = new Date();
    let start: Date | null = null;
    let end: Date | null = now;

    switch (preset) {
      case 'today':
        start = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        start = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        start = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        start = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      case 'all':
        start = null;
        end = null;
        break;
    }

    onFilterChange({
      ...filters,
      dateRange: { ...filters.dateRange, preset, start, end }
    });
  };

  const handleOrderTypeChange = (orderType: typeof filters.orderType) => {
    onFilterChange({ ...filters, orderType });
  };

  const handleSortChange = (sortBy: typeof filters.sortBy) => {
    onFilterChange({ ...filters, sortBy });
  };

  const toggleSortOrder = () => {
    onFilterChange({
      ...filters,
      sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc'
    });
  };

  const clearFilters = () => {
    onFilterChange({
      status: [],
      dateRange: { start: null, end: null, preset: 'all' },
      orderType: 'all',
      priceRange: { min: 0, max: 10000 },
      sortBy: 'date',
      sortOrder: 'desc'
    });
  };

  const activeFiltersCount = 
    filters.status.length +
    (filters.dateRange.preset !== 'all' ? 1 : 0) +
    (filters.orderType !== 'all' ? 1 : 0);

  if (!isOpen) {
    return (
      <div className="w-full">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white border-2 border-elite-burgundy/10 hover:border-elite-burgundy/30 transition-all touch-manipulation active:scale-95"
        >
          <Filter className="w-4 h-4 text-elite-burgundy" />
          <span className="font-cabin font-semibold text-elite-black">Filters</span>
          {activeFiltersCount > 0 && (
            <span className="bg-elite-burgundy text-elite-cream text-xs font-cabin font-bold px-2 py-0.5 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-3xl shadow-lg border-2 border-elite-burgundy/10 p-5 space-y-5 animate-in slide-in-from-top-2 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-calistoga text-lg text-elite-black">Filters</h3>
        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm font-cabin font-semibold text-elite-burgundy hover:underline"
            >
              Clear All
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-full hover:bg-elite-cream transition-colors"
          >
            <X className="w-5 h-5 text-elite-black" />
          </button>
        </div>
      </div>

      {/* Status Filter */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-cabin font-semibold text-elite-black">
          <Package className="w-4 h-4" />
          Status
        </label>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleStatusToggle(option.value)}
              className={`px-3 py-1.5 rounded-xl text-sm font-cabin font-semibold transition-all touch-manipulation active:scale-95 ${
                filters.status.includes(option.value)
                  ? 'bg-elite-burgundy text-elite-cream'
                  : 'bg-elite-cream text-elite-black hover:bg-elite-burgundy/10'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date Range */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-cabin font-semibold text-elite-black">
          <Calendar className="w-4 h-4" />
          Date Range
        </label>
        <div className="flex flex-wrap gap-2">
          {datePresets.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handleDatePreset(preset.value as any)}
              className={`px-3 py-1.5 rounded-xl text-sm font-cabin font-semibold transition-all touch-manipulation active:scale-95 ${
                filters.dateRange.preset === preset.value
                  ? 'bg-elite-burgundy text-elite-cream'
                  : 'bg-elite-cream text-elite-black hover:bg-elite-burgundy/10'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Order Type */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-cabin font-semibold text-elite-black">
          <Package className="w-4 h-4" />
          Order Type
        </label>
        <div className="flex gap-2">
          {['all', 'delivery', 'pickup'].map((type) => (
            <button
              key={type}
              onClick={() => handleOrderTypeChange(type as any)}
              className={`flex-1 px-3 py-2 rounded-xl text-sm font-cabin font-semibold capitalize transition-all touch-manipulation active:scale-95 ${
                filters.orderType === type
                  ? 'bg-elite-burgundy text-elite-cream'
                  : 'bg-elite-cream text-elite-black hover:bg-elite-burgundy/10'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Sort Options */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-cabin font-semibold text-elite-black">
          <ArrowUpDown className="w-4 h-4" />
          Sort By
        </label>
        <div className="flex gap-2">
          <select
            value={filters.sortBy}
            onChange={(e) => handleSortChange(e.target.value as any)}
            className="flex-1 px-3 py-2 rounded-xl bg-elite-cream text-elite-black font-cabin font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-elite-burgundy"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            onClick={toggleSortOrder}
            className="px-4 py-2 rounded-xl bg-elite-cream text-elite-black font-cabin font-semibold text-sm hover:bg-elite-burgundy/10 transition-colors touch-manipulation active:scale-95"
          >
            {filters.sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="pt-4 border-t border-elite-burgundy/10">
        <p className="text-sm font-cabin text-elite-black/60 text-center">
          Showing <span className="font-bold text-elite-burgundy">{orderCount}</span> order{orderCount !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
