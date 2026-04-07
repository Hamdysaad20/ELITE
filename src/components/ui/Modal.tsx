"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export default function Modal({
  isOpen,
  onClose,
  children,
  className,
  title,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Handle SSR
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  }, [onClose]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
      // Prevent background scroll on iOS
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, [isOpen, handleClose]);

  if (!mounted || (!isOpen && !isClosing)) return null;

  return createPortal(
    <>
      {/* Mobile: Full screen overlay with bottom sheet */}
      <div className="md:hidden">
        <div className="fixed inset-0 z-[80] flex items-end justify-center">
          {/* Backdrop */}
          <div
            ref={overlayRef}
            className={cn(
              "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200",
              isClosing ? "opacity-0" : "opacity-100",
            )}
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Modal Content - Bottom Sheet Style */}
          <div
            ref={contentRef}
            className={cn(
              "relative w-full max-h-[92vh] transform overflow-hidden rounded-t-[28px] bg-white shadow-2xl transition-transform duration-300 ease-out",
              isClosing ? "translate-y-full" : "translate-y-0",
              className,
            )}
            role="dialog"
            aria-modal="true"
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-2.5 pb-1 sticky top-0 bg-white z-20">
              <div className="w-10 h-1 bg-elite-black/15 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-elite-burgundy/8 sticky top-6 bg-white z-10">
              <h3 className="font-calistoga text-lg text-elite-black">
                {title}
              </h3>
              <button
                onClick={handleClose}
                className="rounded-full w-9 h-9 flex items-center justify-center text-elite-black/50 bg-elite-black/5 active:bg-elite-burgundy/10 active:text-elite-burgundy transition-colors touch-manipulation active:scale-90"
                aria-label="Close"
              >
                <X className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>

            {/* Body */}
            <div className="max-h-[calc(92vh-72px)] overflow-y-auto overscroll-contain">
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: Centered modal */}
      <div className="hidden md:flex fixed inset-0 z-[80] items-center justify-center p-6 lg:p-8">
        {/* Backdrop */}
        <div
          className={cn(
            "absolute inset-0 bg-black/55 backdrop-blur-sm transition-opacity duration-200",
            isClosing ? "opacity-0" : "opacity-100",
          )}
          onClick={handleClose}
          aria-hidden="true"
        />

        {/* Modal Content */}
        <div
          className={cn(
            "relative w-full max-w-2xl lg:max-w-3xl transform overflow-hidden rounded-3xl bg-white shadow-[0_32px_80px_rgba(0,0,0,0.22)] transition-all duration-200",
            isClosing ? "opacity-0 scale-95" : "opacity-100 scale-100",
            className,
          )}
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-7 py-5 border-b border-elite-burgundy/10">
            <h3 className="font-calistoga text-2xl text-elite-black">
              {title}
            </h3>
            <button
              onClick={handleClose}
              className="rounded-full w-10 h-10 flex items-center justify-center text-elite-black/40 hover:bg-elite-burgundy/6 hover:text-elite-burgundy transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body — max 86vh minus the ~73px header */}
          <div className="max-h-[calc(86vh-73px)] overflow-y-auto overscroll-contain">
            {children}
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
