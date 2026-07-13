"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export default function SettingsModal({ 
  open, 
  onClose 
}: { 
  open: boolean; 
  onClose: () => void 
}) {
  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* 배경 */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        {/* 중앙 플로팅 모달 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 w-full max-w-2xl rounded-2xl shadow-2xl workspace-surface border border-[var(--workspace-border)] max-h-[90vh] overflow-hidden"
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between border-b border-[var(--workspace-border)] px-6 py-4">
            <p className="text-lg font-semibold text-[var(--workspace-text)]">설정</p>
            <button 
              onClick={onClose} 
              className="rounded-lg p-2 text-[var(--workspace-text-secondary)] hover:bg-[var(--workspace-surface)] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* 본문 (임시) */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            <div className="text-center py-12 text-[var(--workspace-text-secondary)]">
              <p>설정 메뉴가 곧 고도화됩니다.</p>
              <p className="text-sm mt-2">(Phase 3에서 4개 카테고리로 확장 예정)</p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
