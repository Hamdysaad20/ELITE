"use client";

import { useRef, useEffect, useState, useMemo, useId } from "react";
import { useReducedMotion } from "framer-motion";

interface CurvedLoopProps {
  marqueeText?: string;
  speed?: number;
  className?: string;
  curveAmount?: number;
  direction?: "left" | "right";
  interactive?: boolean;
}

export function CurvedLoop({
  marqueeText = "",
  speed = 2,
  className,
  curveAmount = 400,
  direction = "left",
  interactive = true,
}: CurvedLoopProps) {
  const prefersReduced = useReducedMotion();

  const text = useMemo(() => {
    const hasTrailing = /\s|\u00A0$/.test(marqueeText);
    return (
      (hasTrailing ? marqueeText.replace(/\s+$/, "") : marqueeText) + "\u00A0"
    );
  }, [marqueeText]);

  const measureRef = useRef<SVGTextElement>(null);
  const textPathRef = useRef<SVGTextPathElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [spacing, setSpacing] = useState(0);
  const [offset, setOffset] = useState(0);

  const uid = useId();
  const pathId = `curve-${uid}`;
  const pathD = `M-100,40 Q500,${40 + curveAmount} 1540,40`;

  const dragRef = useRef(false);
  const lastXRef = useRef(0);
  const dirRef = useRef<"left" | "right">(direction);
  const velRef = useRef(0);

  const totalText = useMemo(() => {
    if (!spacing) return text;
    return Array(Math.ceil(1800 / spacing) + 2)
      .fill(text)
      .join("");
  }, [text, spacing]);

  const ready = spacing > 0;

  useEffect(() => {
    if (measureRef.current) {
      setSpacing(measureRef.current.getComputedTextLength());
    }
  }, [text, className]);

  useEffect(() => {
    if (!spacing || !textPathRef.current) return;
    const initial = -spacing;
    textPathRef.current.setAttribute("startOffset", String(initial) + "px");
    setOffset(initial);
  }, [spacing]);

  useEffect(() => {
    if (!spacing || !ready || prefersReduced) return;

    let frame: number;
    const step = () => {
      if (!dragRef.current && textPathRef.current) {
        const delta = dirRef.current === "right" ? speed : -speed;
        const current = parseFloat(
          textPathRef.current.getAttribute("startOffset") ?? "0",
        );
        let next = current + delta;
        if (next <= -spacing) next += spacing;
        if (next > 0) next -= spacing;
        textPathRef.current.setAttribute("startOffset", next + "px");
        setOffset(next);
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [spacing, speed, ready, prefersReduced]);

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!interactive) return;
    dragRef.current = true;
    lastXRef.current = e.clientX;
    velRef.current = 0;
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!interactive || !dragRef.current || !textPathRef.current) return;
    const dx = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;
    velRef.current = dx;
    const current = parseFloat(
      textPathRef.current.getAttribute("startOffset") ?? "0",
    );
    let next = current + dx;
    if (next <= -spacing) next += spacing;
    if (next > 0) next -= spacing;
    textPathRef.current.setAttribute("startOffset", next + "px");
    setOffset(next);
  };

  const endDrag = () => {
    if (!interactive) return;
    dragRef.current = false;
    dirRef.current = velRef.current > 0 ? "right" : "left";
  };

  const cursorStyle = !interactive
    ? "auto"
    : dragRef.current
      ? "grabbing"
      : "grab";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        visibility: ready ? "visible" : "hidden",
        cursor: cursorStyle,
      }}
    >
      <svg
        viewBox="0 0 1440 120"
        style={{
          userSelect: "none",
          width: "100%",
          aspectRatio: "100 / 12",
          overflow: "visible",
          display: "block",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
        {/* hidden text used only to measure glyph length */}
        <text
          ref={measureRef}
          xmlSpace="preserve"
          style={{ visibility: "hidden", opacity: 0, pointerEvents: "none" }}
          className={className}
        >
          {text}
        </text>

        <defs>
          <path
            ref={pathRef}
            id={pathId}
            d={pathD}
            fill="none"
            stroke="transparent"
          />
        </defs>

        {ready && (
          <text xmlSpace="preserve" className={className}>
            <textPath
              ref={textPathRef}
              href={`#${pathId}`}
              startOffset={offset + "px"}
              xmlSpace="preserve"
            >
              {totalText}
            </textPath>
          </text>
        )}
      </svg>
    </div>
  );
}
