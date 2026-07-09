"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

const VARIANTS = {
  rest: { opacity: 0, maxHeight: 0, marginTop: 0 },
  hover: { opacity: 1, maxHeight: 180, marginTop: 12 },
};

/** 부모 motion 컨테이너(initial="rest" whileHover="hover" animate="rest")의
 * 호버 상태를 그대로 물려받아, 카드 안 보조 설명을 부드럽게 펼치는 공용 래퍼. */
export default function ExpandOnHover({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={VARIANTS}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`overflow-hidden ${className}`}
    >
      {children}
    </motion.div>
  );
}
