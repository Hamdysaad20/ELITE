"use client";

import { useRef, useEffect, useState, useMemo, useId } from "react";
import { useReducedMotion } from "framer-motion";

interface CurvedLoopProps {
  marqueeText?: string;
  speed?: number;
  /** CSS class applied to the SVG <text> element — use fill-*, font-*, text-* utilities */
  className?: string;
  /** How deep the arc bows (quadratic bezier control-point offset from baseline y=40) */
  curveAmount?: number;
  direction?: "left" | "right";
  interactive?: boolean;
  /**
   * Explicit CSS height for the SVG (e.g. "clamp(80px, 12vw, 180px)").
   * When set, the SVG scales with preserveAspectRatio="xMidYMid slice" so the
   * arc stays proportional and text clips cleanly at container edges — ideal for
   * fixed-height marquee strips. When omitted the SVG keeps its natural 100:12
   * aspect ratio with overflow visible.
   */
  svgHeight?: string;
}

export function CurvedLoop({
  marqueeText = "",
  speed = 2,
  className,
  curveAmount = 400,
  direction = "left",
  interactive = true,
  svgHeight,
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
  // Quadratic bezier: baseline at y=40, control point bows down by curveAmount
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

  // When svgHeight is provided: SVG fills the explicit height using slice scaling
  // so the arc is always proportional to the container. Edges clip cleanly.
  // When omitted: natural 100:12 aspect ratio with overflow visible (original behaviour).
  const svgStyle: React.CSSProperties = svgHeight
    ? {
        userSelect: "none",
        width: "100%",
        height: svgHeight,
        overflow: "hidden",
        display: "block",
      }
    : {
        userSelect: "none",
        width: "100%",
        aspectRatio: "100 / 12",
        overflow: "visible",
        display: "block",
      };

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
        preserveAspectRatio={svgHeight ? "xMidYMid slice" : "xMidYMid meet"}
        style={svgStyle}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
        {/* hidden — used only to measure text length */}
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
