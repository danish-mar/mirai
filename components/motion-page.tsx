"use client";

import { motion } from "framer-motion";

export function MotionPage({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className={className}
      style={style}
    >
      {children}
    </motion.main>
  );
}
