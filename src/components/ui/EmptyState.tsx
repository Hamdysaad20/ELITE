"use client";

import { Coffee, Search, Package, Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface EmptyStateProps {
  variant?: "no-data" | "no-results" | "coming-soon" | "no-products";
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export default function EmptyState({
  variant = "no-data",
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  secondaryActionLabel,
  secondaryActionHref,
  onSecondaryAction,
  className,
}: EmptyStateProps) {
  const variants = {
    "no-data": {
      icon: Package,
      defaultTitle: "No Data Available",
      defaultDescription: "There's nothing here yet. Check back soon!",
      iconColor: "text-elite-burgundy/40",
    },
    "no-results": {
      icon: Search,
      defaultTitle: "No Results Found",
      defaultDescription:
        "Try adjusting your search or filters to find what you're looking for.",
      iconColor: "text-elite-burgundy/40",
    },
    "coming-soon": {
      icon: Clock,
      defaultTitle: "Coming Soon",
      defaultDescription:
        "We're working on bringing you something special. Stay tuned!",
      iconColor: "text-amber-500/60",
    },
    "no-products": {
      icon: Coffee,
      defaultTitle: "No Products Yet",
      defaultDescription:
        "Products are being synced from our catalog. Please check back in a moment.",
      iconColor: "text-elite-burgundy/40",
    },
  };

  const config = variants[variant];
  const Icon = config.icon;

  const finalTitle = title || config.defaultTitle;
  const finalDescription = description || config.defaultDescription;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-20 sm:py-24 px-4 sm:px-6",
        className,
      )}
    >
      <div className="max-w-xl text-center">
        {/* Icon */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-elite-cream rounded-full blur-3xl opacity-60"></div>
          <Icon
            className={cn(
              "w-24 h-24 sm:w-28 sm:h-28 mx-auto relative",
              config.iconColor,
            )}
          />
        </div>

        {/* Title */}
        <h3 className="text-elite-black font-calistoga text-3xl sm:text-4xl mb-4">
          {finalTitle}
        </h3>

        {/* Description */}
        <p className="text-elite-black/70 font-cabin text-base sm:text-lg mb-8">
          {finalDescription}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {/* Primary Action */}
          {actionLabel && (actionHref || onAction) && (
            <>
              {actionHref ? (
                <Link
                  href={actionHref}
                  className="inline-flex items-center justify-center gap-2 bg-elite-burgundy text-elite-cream px-8 py-4 rounded-full font-cabin font-bold text-lg hover:opacity-90 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <Sparkles className="w-5 h-5" />
                  {actionLabel}
                </Link>
              ) : (
                <button
                  onClick={onAction}
                  className="inline-flex items-center justify-center gap-2 bg-elite-burgundy text-elite-cream px-8 py-4 rounded-full font-cabin font-bold text-lg hover:opacity-90 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <Sparkles className="w-5 h-5" />
                  {actionLabel}
                </button>
              )}
            </>
          )}

          {/* Secondary Action */}
          {secondaryActionLabel &&
            (secondaryActionHref || onSecondaryAction) && (
              <>
                {secondaryActionHref ? (
                  <Link
                    href={secondaryActionHref}
                    className="inline-flex items-center justify-center gap-2 bg-elite-cream text-elite-burgundy border-2 border-elite-burgundy px-8 py-4 rounded-full font-cabin font-bold text-lg hover:bg-elite-burgundy hover:text-elite-cream hover:scale-105 transition-all duration-300"
                  >
                    {secondaryActionLabel}
                  </Link>
                ) : (
                  <button
                    onClick={onSecondaryAction}
                    className="inline-flex items-center justify-center gap-2 bg-elite-cream text-elite-burgundy border-2 border-elite-burgundy px-8 py-4 rounded-full font-cabin font-bold text-lg hover:bg-elite-burgundy hover:text-elite-cream hover:scale-105 transition-all duration-300"
                  >
                    {secondaryActionLabel}
                  </button>
                )}
              </>
            )}
        </div>
      </div>
    </div>
  );
}
