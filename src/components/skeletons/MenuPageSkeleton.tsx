"use client";

import { cn } from "@/lib/utils";
import CategoryPillSkeleton from "./CategoryPillSkeleton";
import ProductCardSkeleton from "./ProductCardSkeleton";

export default function MenuPageSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 min-w-0 animate-pulse">
      {/* Desktop Sidebar Skeleton - Hidden on Mobile */}
      <div className="hidden lg:block lg:w-72 xl:w-80 flex-shrink-0">
        <div className="bg-white rounded-2xl shadow-xl border border-elite-burgundy/10 p-6 sticky top-24 h-[calc(100vh-7rem)]">
          {/* Sidebar Header */}
          <div className="mb-6 pb-4 border-b border-elite-burgundy/10">
            <div className="h-8 w-32 bg-elite-dark-cream rounded-lg mb-2" />
            <div className="h-4 w-24 bg-elite-dark-cream rounded-lg" />
          </div>

          {/* Categories List */}
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-2">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-elite-dark-cream" />
                  <div className="h-5 w-32 bg-elite-dark-cream rounded-lg" />
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar Footer */}
          <div className="mt-6 pt-4 border-t border-elite-burgundy/10 flex justify-center">
            <div className="h-3 w-32 bg-elite-dark-cream rounded-lg" />
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        {/* Mobile Category Pills - Horizontal Scrollable */}
        <div className="lg:hidden mb-8">
          <CategoryPillSkeleton count={6} />
        </div>

        {/* Categories Content */}
        <div className="space-y-10 sm:space-y-12">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="relative">
              <div className="bg-elite-cream rounded-2xl p-5 sm:p-6 lg:p-8 w-full">
                {/* Category Header */}
                <div className="mb-6 sm:mb-8">
                  <div className="flex items-center gap-3 sm:gap-4 mb-4">
                    {/* Icon */}
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-elite-dark-cream" />
                    {/* Title */}
                    <div className="h-8 sm:h-10 w-48 bg-elite-dark-cream rounded-xl" />
                  </div>
                  {/* Description */}
                  <div className="h-5 w-full max-w-md bg-elite-dark-cream rounded-lg" />
                </div>

                {/* Horizontal Product List */}
                <div className="overflow-hidden">
                  <div className="flex gap-5 sm:gap-6 pb-4">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div key={j} className="w-64 sm:w-72 md:w-80 lg:w-96 flex-shrink-0">
                        <ProductCardSkeleton size="small" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Divider */}
              {i < 2 && (
                <div className="h-px bg-elite-burgundy/10 mt-8 sm:mt-12" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
