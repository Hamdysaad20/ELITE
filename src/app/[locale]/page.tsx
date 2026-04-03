"use client";

import { useSession } from "next-auth/react";
import HomePage from "@/components/HomePage";
import LandingPage from "@/components/LandingPage";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "authenticated" && session?.user) {
    return <HomePage user={session.user} />;
  }

  return <LandingPage />;
}
