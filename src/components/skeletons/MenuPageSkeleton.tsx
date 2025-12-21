"use client";

import { cn } from "@/lib/utils";
import { Skeleton } from "../Skeleton";
import CategoryPillSkeleton from "./CategoryPillSkeleton";
import ProductCardSkeleton from "./ProductCardSkeleton";

export default function MenuPageSkeleton() {
  return (
    <>
      {/* Mobile Category Pills - Sticky (matches actual layout) */}
      <div className="lg:hidden sticky top-16 z-30 bg-elite-cream/92 backdrop-blur-md border-b border-elite-burgundy/8 -mx-4 px-4 mb-5">
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 scroll-smooth">
          <div className="flex gap-2 py-2.5 min-w-max">
            {/* All button skeleton */}
            <Skeleton className="h-10 w-16 flex-shrink-0" rounded="full" />
            {/* Category pills */}
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton 
                key={i} 
                className="h-10 flex-shrink-0" 
                rounded="full" 
                style={{ width: `${80 + Math.random() * 40}px` }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 min-w-0">
        {/* Desktop Sidebar Skeleton - Hidden on Mobile */}
        <div className="hidden lg:block lg:w-72 xl:w-80 flex-shrink-0">
          <div className="bg-white rounded-3xl shadow-xl border border-elite-burgundy/10 p-6 sticky top-24 max-h-[calc(100vh-7rem)] overflow-hidden">
            {/* Sidebar Header */}
            <div className="mb-6 pb-4 border-b border-elite-burgundy/20">
              <Skeleton className="h-8 w-32 mb-2" rounded="lg" />
              <Skeleton className="h-4 w-24" rounded="md" />
            </div>

            {/* Categories List - matches actual spacing (space-y-1) */}
            <div className="space-y-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between p-4 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-2 h-2" rounded="full" />
                      <Skeleton 
                        className="h-5" 
                        rounded="lg" 
                        style={{ width: `${100 + Math.random() * 60}px` }} 
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

        <div className="flex-1 min-w-0">
          {/* Mobile: Category sections */}
          <div className="lg:hidden space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <section key={i} className="relative">
                {/* Category Header */}
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10" rounded="xl" />
                    <div>
                      <Skeleton className="h-6 w-32 mb-2" rounded="lg" />
                      <Skeleton className="h-3 w-16" rounded="md" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-16" rounded="full" />
                </div>

                {/* Horizontal Product Scroll */}
                <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 pb-2">
                  <div className="flex gap-3 snap-x snap-mandatory">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div 
                        key={j} 
                        className="w-[160px] flex-shrink-0 snap-start"
                      >
                        <ProductCardSkeleton size="small" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                {i < 2 && (
                  <div className="h-px bg-gradient-to-r from-transparent via-elite-burgundy/10 to-transparent mt-6" />
                )}
              </section>
            ))}
          </div>

          {/* Desktop: Category sections */}
          <div className="hidden lg:block space-y-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="relative">
                <div className="bg-white/50 rounded-2xl p-6 lg:p-8 w-full">
                  {/* Category Header */}
                  <div className="flex items-center gap-4 mb-6">
                    <Skeleton className="w-16 h-16" rounded="xl" />
                    <Skeleton className="h-9 w-48" rounded="xl" />
                  </div>

                  {/* Horizontal Product Scroll */}
                  <div className="overflow-x-auto menu-items-scroll scrollbar-hide -mx-8 px-8 py-4">
                    <div className="flex gap-5 pb-4">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <div key={j} className="w-72 flex-shrink-0 snap-start">
                          <ProductCardSkeleton size="small" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {i < 2 && (
                  <div className="h-px bg-elite-burgundy/10 mt-8" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
