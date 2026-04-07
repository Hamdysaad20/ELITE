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
                className="h-10 flex-shrink-0 w-24"
                rounded="full"
              />
            ))}
          </div>
        </div>
      </div>

      <div className="min-w-0">
        <div className="min-w-0">
          <div className="mb-6 hidden lg:block">
            <div className="rounded-2xl border border-elite-burgundy/10 bg-white/80 px-4 py-4 shadow-sm shadow-elite-burgundy/5">
              <div className="flex flex-wrap gap-2.5">
                <Skeleton className="h-9 w-14" rounded="full" />
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-24" rounded="full" />
                ))}
              </div>
            </div>
          </div>

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
                <div className="w-full rounded-[2rem] border border-elite-burgundy/10 bg-white/80 p-6 shadow-[0_16px_34px_rgba(139,38,53,0.08)] lg:p-8">
                  {/* Category Header */}
                  <div className="mb-6 flex items-start justify-between gap-4 border-b border-elite-burgundy/10 pb-6">
                    <div className="flex items-start gap-4">
                      <Skeleton className="h-16 w-16" rounded="xl" />
                      <div>
                        <Skeleton className="h-9 w-48" rounded="xl" />
                        <Skeleton className="mt-2 h-4 w-72" rounded="md" />
                        <Skeleton className="mt-3 h-6 w-20" rounded="full" />
                      </div>
                    </div>

                    <Skeleton className="h-10 w-24" rounded="full" />
                  </div>

                  {/* Desktop Product Grid */}
                  <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 xl:gap-5 2xl:gap-6">
                    {Array.from({ length: 10 }).map((_, j) => (
                      <ProductCardSkeleton key={j} size="small" />
                    ))}
                  </div>
                </div>
                {i < 2 && <div className="h-px bg-elite-burgundy/10 mt-8" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
