"use client";

import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { useOrdering } from "@/context/OrderingContext";
import { ORDERING_DISABLED_MESSAGE } from "@/lib/constants";
import { SUPPORT_MESSENGER_URL } from "@/lib/support";

export default function OrderingBanner() {
  const { orderingEnabled, orderingMessage, loading } = useOrdering();

  if (loading || orderingEnabled) return null;

  const message = orderingMessage || ORDERING_DISABLED_MESSAGE;

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-start gap-2 text-amber-900">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p className="font-cabin text-sm sm:text-base">
            {message}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <a
            href={SUPPORT_MESSENGER_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-amber-100 text-amber-900 text-xs sm:text-sm font-cabin font-semibold hover:bg-amber-200 transition-colors"
          >
            Get updates
          </a>
          <Link
            href="/#location"
            className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-amber-100 text-amber-900 text-xs sm:text-sm font-cabin font-semibold hover:bg-amber-200 transition-colors"
          >
            Find a location
          </Link>
        </div>
      </div>
    </div>
  );
}
