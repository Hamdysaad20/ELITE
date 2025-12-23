"use client";

import { cn } from "@/lib/utils";
import { Skeleton } from "../Skeleton";
import ProductCardSkeleton from "./ProductCardSkeleton";

export default function CategoryPageSkeleton() {
  return (
    <>
      {/* Mobile Category Pills - Sticky (matches actual layout) */}
      <div className="lg:hidden sticky top-16 z-30 -mx-6 px-4 mb-5 pt-2 pb-3 bg-elite-cream/90 backdrop-blur-sm border-b border-elite-burgundy/5">
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 scroll-smooth">
          <div className="flex gap-2.5 min-w-max py-1">
            {/* Category pills skeleton */}
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton 
                key={i} 
                className="h-10 flex-shrink-0 w-24" 
                rounded="full" 
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 min-w-0">
        {/* Desktop Sidebar Skeleton */}
        <div className="hidden lg:block lg:w-72 xl:w-80 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-xl border border-elite-burgundy/10 p-6 sticky top-24 max-h-[calc(100vh-7rem)] overflow-hidden">
            {/* Sidebar Header */}
            <div className="mb-6 pb-4 border-b border-elite-burgundy/20">
              <Skeleton className="h-8 w-32 mb-2" rounded="lg" />
              <Skeleton className="h-4 w-24" rounded="md" />
            </div>

            {/* Categories List */}
            <div className="space-y-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between p-4 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-2 h-2" rounded="full" />
                      <Skeleton 
                        className="h-5 w-32" 
                        rounded="lg" 
                      />
                    </div>
                  </div>
                  {i < 5 && <div className="h-px bg-elite-burgundy/10 my-3" />}
                </div>
              ))}
            </div>

            {/* Sidebar Footer */}
            <div className="mt-6 pt-4 border-t border-elite-burgundy/20 flex justify-center">
              <Skeleton className="h-3 w-32" rounded="md" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Mobile: Category header */}
          <div className="lg:hidden mb-4 px-1">
            <div className="flex items-center gap-3">
              <Skeleton className="w-11 h-11" rounded="xl" />
              <div>
                <Skeleton className="h-6 w-32 mb-2" rounded="lg" />
                <Skeleton className="h-3 w-24" rounded="md" />
              </div>
            </div>
          </div>

          {/* Desktop: Category header */}
          <div className="hidden lg:block mb-6">
            <div className="flex items-center gap-4 mb-2">
              <Skeleton className="w-16 h-16" rounded="xl" />
              <div>
                <Skeleton className="h-9 w-48 mb-2" rounded="xl" />
                <Skeleton className="h-4 w-64" rounded="md" />
              </div>
            </div>
          </div>

          {/* Products Grid - matches actual grid layout (grid-cols-2 lg:grid-cols-3 xl:grid-cols-4) */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} size="small" />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
