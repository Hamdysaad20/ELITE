"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Toast {
  id: string;
  message: string;
  type?: "success" | "error" | "info";
  timeout?: number; // ms
}

interface ToastContextValue {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      const toast: Toast = { id, timeout: 4000, ...t };
      setToasts((prev) => [...prev, toast]);
      if (toast.timeout && toast.timeout > 0) {
        setTimeout(() => dismiss(id), toast.timeout);
      }
    },
    [dismiss],
  );

  const success = useCallback((message: string) => push({ message, type: "success" }), [push]);
  const error = useCallback((message: string) => push({ message, type: "error" }), [push]);
  const info = useCallback((message: string) => push({ message, type: "info" }), [push]);

  return (
    <ToastContext.Provider value={{ toasts, push, dismiss, success, error, info }}>
      {children}
      <div className="fixed z-[100] top-20 right-4 sm:top-24 sm:right-8 flex flex-col gap-3 w-full max-w-sm pointer-events-none px-4 sm:px-0">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              className={cn(
                "pointer-events-auto relative overflow-hidden rounded-2xl shadow-xl border p-4 flex items-start gap-3 backdrop-blur-md",
                t.type === "success" && "bg-white/95 border-green-200 text-green-900",
                t.type === "error" && "bg-white/95 border-red-200 text-red-900",
                (!t.type || t.type === "info") && "bg-white/95 border-elite-burgundy/10 text-elite-burgundy"
              )}
            >
              {/* Icon */}
              <div className={cn(
                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                t.type === "success" && "bg-green-100 text-green-600",
                t.type === "error" && "bg-red-100 text-red-600",
                (!t.type || t.type === "info") && "bg-elite-burgundy/10 text-elite-burgundy"
              )}>
                {t.type === "success" && <Check className="w-5 h-5" />}
                {t.type === "error" && <AlertCircle className="w-5 h-5" />}
                {(!t.type || t.type === "info") && <Info className="w-5 h-5" />}
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                <p className={cn(
                  "font-cabin font-medium text-sm leading-relaxed",
                  t.type === "success" && "text-green-800",
                  t.type === "error" && "text-red-800",
                  (!t.type || t.type === "info") && "text-elite-black"
                )}>
                  {t.message}
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={() => dismiss(t.id)}
                className="flex-shrink-0 text-black/20 hover:text-black/50 transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Progress Bar (Optional visual flair) */}
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: (t.timeout || 4000) / 1000, ease: "linear" }}
                className={cn(
                  "absolute bottom-0 left-0 right-0 h-1 origin-left opacity-20",
                  t.type === "success" && "bg-green-500",
                  t.type === "error" && "bg-red-500",
                  (!t.type || t.type === "info") && "bg-elite-burgundy"
                )}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
