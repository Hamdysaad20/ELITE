"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface UseSwipeBackOptions {
  enabled?: boolean;
  threshold?: number;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
}

export function useSwipeBack({
  enabled = true,
  threshold = 80,
  onSwipeStart,
  onSwipeEnd,
}: UseSwipeBackOptions = {}) {
  const router = useRouter();
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const isSwipingBack = useRef<boolean>(false);
  const [swipeProgress, setSwipeProgress] = useState<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger if touch starts from left edge (first 50px)
      if (e.touches[0].clientX > 50) return;

      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      isSwipingBack.current = false;
      setSwipeProgress(0);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartX.current === 0) return;

      const touchCurrentX = e.touches[0].clientX;
      const touchCurrentY = e.touches[0].clientY;
      const diffX = touchCurrentX - touchStartX.current;
      const diffY = Math.abs(touchCurrentY - touchStartY.current);

      // Check if horizontal swipe (not vertical scroll)
      if (Math.abs(diffX) > diffY && diffX > 20) {
        if (!isSwipingBack.current) {
          isSwipingBack.current = true;
          onSwipeStart?.();
        }

        // Update swipe progress for visual feedback (0 to 1)
        const progress = Math.min(diffX / threshold, 1);
        setSwipeProgress(progress);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === 0) return;

      const touchEndX = e.changedTouches[0].clientX;
      const diffX = touchEndX - touchStartX.current;

      // If swiped right more than threshold, go back
      if (isSwipingBack.current && diffX > threshold) {
        router.back();
      }

      // Reset
      touchStartX.current = 0;
      touchStartY.current = 0;
      isSwipingBack.current = false;
      setSwipeProgress(0);
      onSwipeEnd?.();
    };

    // Add listeners to document for global swipe-back
    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [enabled, threshold, router, onSwipeStart, onSwipeEnd]);

  return { swipeProgress, isSwipingBack: isSwipingBack.current };
}
