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
      defaultDescription: "Try adjusting your search or filters to find what you're looking for.",
      iconColor: "text-elite-burgundy/40",
    },
    "coming-soon": {
      icon: Clock,
      defaultTitle: "Coming Soon",
      defaultDescription: "We're working on bringing you something special. Stay tuned!",
      iconColor: "text-amber-500/60",
    },
    "no-products": {
      icon: Coffee,
      defaultTitle: "No Products Yet",
      defaultDescription: "Products are being synced from our catalog. Please check back in a moment.",
      iconColor: "text-elite-burgundy/40",
    },
  };

  const config = variants[variant];
  const Icon = config.icon;

  const finalTitle = title || config.defaultTitle;
  const finalDescription = description || config.defaultDescription;

  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4", className)}>
      <div className="max-w-md text-center">
        {/* Icon */}
        <div className="mb-6 relative">
          <div className="absolute inset-0 bg-elite-cream rounded-full blur-2xl opacity-50"></div>
          <Icon className={cn("w-20 h-20 mx-auto relative", config.iconColor)} />
        </div>

        {/* Title */}
        <h3 className="text-elite-black font-calistoga text-2xl mb-3">
          {finalTitle}
        </h3>

        {/* Description */}
        <p className="text-elite-black/70 font-cabin text-base mb-6">
          {finalDescription}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {/* Primary Action */}
          {(actionLabel && (actionHref || onAction)) && (
            <>
              {actionHref ? (
                <Link
                  href={actionHref}
                  className="inline-flex items-center justify-center gap-2 bg-elite-burgundy text-elite-cream px-6 py-3 rounded-full font-cabin font-semibold hover:bg-elite-dark-burgundy transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  {actionLabel}
                </Link>
              ) : (
                <button
                  onClick={onAction}
                  className="inline-flex items-center justify-center gap-2 bg-elite-burgundy text-elite-cream px-6 py-3 rounded-full font-cabin font-semibold hover:bg-elite-dark-burgundy transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  {actionLabel}
                </button>
              )}
            </>
          )}

          {/* Secondary Action */}
          {(secondaryActionLabel && (secondaryActionHref || onSecondaryAction)) && (
            <>
              {secondaryActionHref ? (
                <Link
                  href={secondaryActionHref}
                  className="inline-flex items-center justify-center gap-2 bg-elite-cream text-elite-burgundy border-2 border-elite-burgundy px-6 py-3 rounded-full font-cabin font-semibold hover:bg-elite-burgundy hover:text-elite-cream transition-all"
                >
                  {secondaryActionLabel}
                </Link>
              ) : (
                <button
                  onClick={onSecondaryAction}
                  className="inline-flex items-center justify-center gap-2 bg-elite-cream text-elite-burgundy border-2 border-elite-burgundy px-6 py-3 rounded-full font-cabin font-semibold hover:bg-elite-burgundy hover:text-elite-cream transition-all"
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
