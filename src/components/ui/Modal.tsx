"use client";

import { useEffect, useRef } from "react";
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

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Mobile: Full screen overlay with bottom sheet */}
      <div className="md:hidden">
        <div className="fixed inset-0 z-[80] flex items-end justify-center">
          {/* Backdrop */}
          <div
            ref={overlayRef}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal Content - Bottom Sheet Style */}
          <div
            ref={contentRef}
            className={cn(
              "relative w-full max-h-[90vh] transform overflow-hidden rounded-t-3xl bg-white shadow-2xl transition-all animate-in slide-in-from-bottom duration-300",
              className
            )}
            role="dialog"
            aria-modal="true"
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-elite-black/10 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-elite-burgundy/10 sticky top-0 bg-white z-10">
              <h3 className="font-calistoga text-lg text-elite-black">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-elite-black/50 hover:bg-elite-burgundy/5 hover:text-elite-burgundy transition-colors touch-manipulation active:scale-90"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="max-h-[calc(90vh-80px)] overflow-y-auto overscroll-contain">
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: Centered modal */}
      <div className="hidden md:flex fixed inset-0 z-[80] items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal Content */}
        <div
          className={cn(
            "relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200",
            className
          )}
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-elite-burgundy/10">
            <h3 className="font-calistoga text-xl text-elite-black">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-elite-black/50 hover:bg-elite-burgundy/5 hover:text-elite-burgundy transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="max-h-[80vh] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
