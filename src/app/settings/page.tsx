"use client";

import { useEffect } from "react";
import { useLocalizedRouter } from "@/hooks/useLocalizedRouter";

export default function SettingsPage() {
  const router = useLocalizedRouter();

  useEffect(() => {
    router.replace("/profile?tab=settings");
  }, [router]);

  return (
    <div className="min-h-screen bg-elite-cream flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-elite-burgundy border-t-transparent" />
    </div>
  );
}
