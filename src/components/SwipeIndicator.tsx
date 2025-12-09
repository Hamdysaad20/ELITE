"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";

interface SwipeIndicatorProps {
  progress: number;
  isActive: boolean;
}

export default function SwipeIndicator({ progress, isActive }: SwipeIndicatorProps) {
  return (
    <AnimatePresence>
      {isActive && progress > 0.1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-50 pointer-events-none md:hidden"
        >
          <motion.div
            className="flex items-center justify-center w-16 h-16 bg-elite-burgundy/20 backdrop-blur-md rounded-r-full shadow-lg"
            style={{
              opacity: progress,
              scale: 0.8 + progress * 0.2,
            }}
          >
            <ChevronLeft
              className="text-elite-burgundy"
              size={32}
              strokeWidth={3}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
