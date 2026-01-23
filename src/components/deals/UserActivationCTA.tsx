"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { User, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserActivationCTAProps {
  className?: string;
}

export default function UserActivationCTA({
  className,
}: UserActivationCTAProps) {
  const { data: session } = useSession();
  const router = useRouter();

  // Check if user is logged in
  if (!session?.user) {
    return null; // Don't show for non-logged-in users (or show different CTA)
  }

  // Check profile completeness (simplified - expand later)
  // TODO: Add more comprehensive checks (phone, address, preferences, etc.)
  // For now, just check if user has email (basic completeness)
  const isProfileComplete = !!session.user.email;

  if (isProfileComplete) {
    return null; // Don't show if profile is complete
  }

  const handleClick = () => {
    router.push(`/profile?redirect=/deals`);
  };

  return (
    <div
      className={cn(
        "bg-gradient-to-r from-elite-burgundy to-elite-burgundy/90 rounded-2xl p-6 md:p-8 text-elite-cream",
        "shadow-lg border border-elite-burgundy/20",
        className,
      )}
    >
      <div className="flex items-start gap-4">
        <div className="bg-elite-cream/20 rounded-xl p-3 flex-shrink-0">
          <Sparkles className="w-6 h-6 text-elite-cream" />
        </div>

        <div className="flex-1">
          <h3 className="font-calistoga text-xl md:text-2xl mb-2">
            🎁 Unlock Exclusive Deals
          </h3>
          <p className="font-cabin text-elite-cream/90 mb-4 text-sm md:text-base">
            Complete your profile to get personalized deals, early access to new
            offers, and special discounts.
          </p>

          <ul className="space-y-2 mb-4 text-sm md:text-base">
            <li className="flex items-center gap-2 font-cabin text-elite-cream/90">
              <span className="text-emerald-300">✓</span>
              Personalized deals based on your preferences
            </li>
            <li className="flex items-center gap-2 font-cabin text-elite-cream/90">
              <span className="text-emerald-300">✓</span>
              Early access to new offers
            </li>
            <li className="flex items-center gap-2 font-cabin text-elite-cream/90">
              <span className="text-emerald-300">✓</span>
              Special discounts and promotions
            </li>
          </ul>

          <button
            onClick={handleClick}
            className="w-full sm:w-auto bg-elite-cream text-elite-burgundy px-6 py-3 rounded-xl font-cabin font-bold text-sm md:text-base hover:bg-elite-cream/90 transition-all flex items-center justify-center gap-2 shadow-md"
          >
            <User className="w-4 h-4" />
            Complete Profile
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
