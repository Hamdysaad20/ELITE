"use client";

import { cn } from "@/lib/utils";
import ProductCardSkeleton from "./ProductCardSkeleton";

export default function CategoryPageSkeleton() {
  return (
    <div className="min-h-screen bg-elite-cream animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-elite-burgundy py-8">
        <div className="max-w-7xl mx-auto px-6">
          {/* Breadcrumb */}
          <div className="h-4 w-32 bg-white/20 rounded mb-4" />

          {/* Category Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-white/20" />
            <div>
              <div className="h-10 w-64 bg-white/20 rounded mb-2" />
              <div className="h-6 w-96 bg-white/20 rounded" />
            </div>
          </div>

          {/* Back Button */}
          <div className="h-12 w-40 bg-white/20 rounded-full" />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Side Navigation Skeleton */}
          <div className="hidden lg:block lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-xl border border-elite-burgundy/10 p-6 sticky top-6 h-[calc(100vh-3rem)]">
              {/* Sidebar Header */}
              <div className="mb-6 pb-4 border-b border-elite-burgundy/10">
                <div className="h-6 w-24 bg-elite-dark-cream rounded mb-2" />
                <div className="h-3 w-32 bg-elite-dark-cream rounded" />
              </div>

              {/* Categories List */}
              <div className="space-y-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-elite-dark-cream" />
                      <div className="h-4 w-32 bg-elite-dark-cream rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side Content Skeleton */}
          <div className="flex-1">
            <div className="bg-elite-cream rounded-2xl shadow-md p-8 border border-elite-burgundy/10">
              {/* Subcategory Header */}
              <div className="mb-8">
                <div className="h-8 w-48 bg-elite-dark-cream rounded mb-3" />
                <div className="h-5 w-full max-w-2xl bg-elite-dark-cream rounded" />
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProductCardSkeleton key={i} size="medium" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
