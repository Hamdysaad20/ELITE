"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, AlertCircle, X, Plus, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { useTranslations } from "next-intl";

interface ReorderConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (action: "replace" | "merge") => void;
  existingItemCount: number;
  reorderItemCount: number;
  isProcessing: boolean;
}

/**
 * Modal to confirm reorder action when cart has existing items
 * Follows Elite Coffee design system with burgundy/cream theme
 */
export function ReorderConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  existingItemCount,
  reorderItemCount,
  isProcessing,
}: ReorderConfirmModalProps) {
  const t = useTranslations("reorderModal");

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isProcessing) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
      return () => window.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, isProcessing, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isProcessing && onClose()}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] touch-none"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="bg-white rounded-3xl shadow-2xl border-2 border-elite-burgundy/10 max-w-md w-full overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="bg-gradient-to-br from-elite-burgundy to-elite-burgundy/90 px-6 py-5 relative">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-elite-cream/20 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-6 h-6 text-elite-cream" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-calistoga text-xl text-elite-cream mb-1">
                      {t("title")}
                    </h3>
                    <p className="font-cabin text-sm text-elite-cream/90 leading-relaxed">
                      {t("subtitle")}
                    </p>
                  </div>
                  {!isProcessing && (
                    <button
                      onClick={onClose}
                      className="flex-shrink-0 w-8 h-8 rounded-xl bg-elite-cream/10 hover:bg-elite-cream/20 flex items-center justify-center transition-all active:scale-95 touch-manipulation"
                      aria-label={t("close")}
                    >
                      <X className="w-5 h-5 text-elite-cream" />
                    </button>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-6 space-y-4">
                {/* Current Cart Info */}
                <div className="bg-elite-cream/40 rounded-2xl p-4 border-2 border-elite-burgundy/5">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingBag className="w-5 h-5 text-elite-burgundy" />
                    <span className="font-cabin font-bold text-sm text-elite-black">
                      {t("currentCart.title")}
                    </span>
                  </div>
                  <p className="font-cabin text-sm text-elite-black/70">
                    <span className="font-bold text-elite-burgundy">
                      {existingItemCount}
                    </span>{" "}
                    {t("currentCart.items", { count: existingItemCount })}
                  </p>
                </div>

                {/* Reorder Info */}
                <div className="bg-elite-cream/40 rounded-2xl p-4 border-2 border-elite-burgundy/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Plus className="w-5 h-5 text-elite-burgundy" />
                    <span className="font-cabin font-bold text-sm text-elite-black">
                      {t("reorder.title")}
                    </span>
                  </div>
                  <p className="font-cabin text-sm text-elite-black/70">
                    <span className="font-bold text-elite-burgundy">
                      {reorderItemCount}
                    </span>{" "}
                    {t("reorder.items", { count: reorderItemCount })}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 gap-3 pt-2">
                  {/* Add to Cart (Merge) */}
                  <button
                    onClick={() => onConfirm("merge")}
                    disabled={isProcessing}
                    className="w-full px-6 py-4 bg-elite-burgundy text-elite-cream rounded-2xl font-cabin font-bold text-base hover:bg-elite-burgundy/90 hover:shadow-lg transition-all duration-300 active:scale-95 touch-manipulation flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 min-h-[56px]"
                  >
                    <Plus className="w-5 h-5" />
                    <span>{t("actions.addToExisting")}</span>
                  </button>

                  {/* Replace Cart */}
                  <button
                    onClick={() => onConfirm("replace")}
                    disabled={isProcessing}
                    className="w-full px-6 py-4 bg-white border-2 border-elite-burgundy/20 text-elite-burgundy rounded-2xl font-cabin font-bold text-base hover:bg-elite-cream/50 hover:border-elite-burgundy/40 hover:shadow-md transition-all duration-300 active:scale-95 touch-manipulation flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 min-h-[56px]"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span>{t("actions.replaceCart")}</span>
                  </button>

                  {/* Cancel */}
                  {!isProcessing && (
                    <button
                      onClick={onClose}
                      className="w-full px-6 py-3 bg-transparent text-elite-black/60 rounded-2xl font-cabin font-semibold text-sm hover:text-elite-black hover:bg-elite-cream/30 transition-all duration-300 active:scale-95 touch-manipulation min-h-[44px]"
                    >
                      {t("actions.cancel")}
                    </button>
                  )}
                </div>

                {/* Helper Text */}
                <p className="text-xs text-elite-black/50 font-cabin text-center leading-relaxed pt-2">
                  <span className="font-semibold">
                    {t("helper.addToCartTitle")}
                  </span>{" "}
                  {t("helper.addToCartBody")}
                  <br />
                  <span className="font-semibold">
                    {t("helper.replaceCartTitle")}
                  </span>{" "}
                  {t("helper.replaceCartBody")}
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
