"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useEffect } from "react";
import { HomePage } from "@/components/HomePage";

export default function HomeDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/${locale}/auth/signin`);
    }
  }, [status, router, locale]);

  if (status === "loading") {
    return (
      <div
        className="flex items-center justify-center"
        style={{ minHeight: "60vh" }}
      >
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{
            borderColor: "var(--elite-cream)",
            borderTopColor: "var(--elite-burgundy)",
          }}
        />
      </div>
    );
  }

  if (!session?.user) return null;

  return <HomePage user={session.user} />;
}
