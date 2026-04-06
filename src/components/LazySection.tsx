"use client";

import { useRef, useState, useEffect, type ReactNode } from "react";

interface LazySectionProps {
  children: ReactNode;
  /** How far before viewport to start loading (default "400px") */
  rootMargin?: string;
  /** Placeholder shown before the section enters the load zone */
  fallback?: ReactNode;
  /** Minimum height to prevent CLS when the section hasn't loaded yet */
  minHeight?: string;
}

/**
 * Defers rendering of children until the placeholder enters (or is near)
 * the viewport. Uses IntersectionObserver with a configurable rootMargin
 * so heavy sections further down the page skip their JS/render cost on
 * initial load. Once triggered, the observer disconnects and children
 * stay mounted permanently.
 */
export function LazySection({
  children,
  rootMargin = "400px",
  fallback,
  minHeight,
}: LazySectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  if (visible) return <>{children}</>;

  return (
    <div ref={ref} style={minHeight ? { minHeight } : undefined}>
      {fallback}
    </div>
  );
}
