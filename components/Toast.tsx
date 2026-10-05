"use client";

import { Check, Info } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function Toast({
  message,
  onDismiss
}: {
  message: string;
  onDismiss?: () => void;
}) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          className="toast"
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          onAnimationComplete={() => undefined}
          onClick={onDismiss}
        >
          {message.toLowerCase().includes("saved") || message.toLowerCase().includes("download") ? <Check size={16} /> : <Info size={16} />}
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
