"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export default function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" onClick={onClose}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          onClick={e => e.stopPropagation()}
          className="relative z-10 w-full max-w-2xl rounded-2xl shadow-2xl workspace-surface border border-[var(--workspace-border)] max-h-[90vh] overflow-hidden"
        >
          <div className="flex items-center justify-between border-b border-[var(--workspace-border)] px-6 py-4">
            <p className="text-lg font-semibold">설정</p>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--workspace-surface)]">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-8 text-center text-[var(--workspace-text-secondary)]">
            <p>설정 메뉴가 곧 고도화됩니다.</p>
            <p className="text-sm mt-1">(Phase 3에서 확장 예정)</p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
