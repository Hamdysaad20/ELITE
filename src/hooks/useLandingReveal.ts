"use client";

import { type RefObject, useLayoutEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type RevealElement = HTMLElement | SVGElement;
type RevealTarget = RefObject<RevealElement | null> | RevealElement | null;
type RevealTargetGroup = RevealTarget | RevealTarget[];

interface UseLandingRevealOptions {
  rootRef: RefObject<HTMLElement | null>;
  revealTargets?: RevealTargetGroup[];
  staggerTargets?: RevealTargetGroup[];
  start?: string;
  yDesktop?: number;
  yMobile?: number;
  durationDesktop?: number;
  durationMobile?: number;
  stagger?: number;
}

const DEFAULT_START = "top 88%";

function isRefObject(
  target: RevealTarget,
): target is RefObject<RevealElement | null> {
  return target !== null && typeof target === "object" && "current" in target;
}

function resolveTargets(
  targetGroups: RevealTargetGroup[] = [],
): RevealElement[] {
  const resolved = targetGroups.flatMap((group) => {
    const targets = Array.isArray(group) ? group : [group];

    return targets.flatMap((target) => {
      const element = isRefObject(target) ? target.current : target;
      return element ? [element] : [];
    });
  });

  return Array.from(new Set(resolved));
}

function hasPassedStartThreshold(root: HTMLElement, start: string): boolean {
  const [, viewportPosition] = start.split(" ");

  if (!viewportPosition?.endsWith("%")) {
    return false;
  }

  const threshold =
    (Number.parseFloat(viewportPosition) / 100) * window.innerHeight;
  return root.getBoundingClientRect().top <= threshold;
}

export function useLandingReveal({
  rootRef,
  revealTargets = [],
  staggerTargets = [],
  start = DEFAULT_START,
  yDesktop = 40,
  yMobile = 24,
  durationDesktop = 0.9,
  durationMobile = 0.75,
  stagger = 0.1,
}: UseLandingRevealOptions): void {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const revealElements = resolveTargets(revealTargets);
    const staggerElements = resolveTargets(staggerTargets);
    const allTargets = Array.from(
      new Set([...revealElements, ...staggerElements]),
    );

    if (allTargets.length === 0) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const y = isMobile ? yMobile : yDesktop;
    const duration = isMobile ? durationMobile : durationDesktop;

    const context = gsap.context(() => {
      if (prefersReducedMotion || hasPassedStartThreshold(root, start)) {
        gsap.set(allTargets, {
          opacity: 1,
          y: 0,
          clearProps: "transform,opacity,willChange",
        });
        return;
      }

      gsap.set(allTargets, {
        opacity: 0,
        y,
        willChange: "transform, opacity",
        force3D: true,
      });

      const timeline = gsap.timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: {
          trigger: root,
          start,
          toggleActions: "play none none none",
        },
      });

      if (revealElements.length > 0) {
        timeline.to(revealElements, {
          opacity: 1,
          y: 0,
          duration,
          stagger: revealElements.length > 1 ? 0.08 : 0,
          clearProps: "willChange",
        });
      }

      if (staggerElements.length > 0) {
        timeline.to(
          staggerElements,
          {
            opacity: 1,
            y: 0,
            duration,
            stagger,
            clearProps: "willChange",
          },
          revealElements.length > 0 ? "-=0.52" : 0,
        );
      }
    }, root);

    return () => {
      context.revert();
    };
  }, [
    durationDesktop,
    durationMobile,
    revealTargets,
    rootRef,
    stagger,
    staggerTargets,
    start,
    yDesktop,
    yMobile,
  ]);
}
