"use client";
import { motion, AnimatePresence } from "framer-motion";

export default function TransitionOverlay({ active }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="transition"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="fixed inset-0 z-[999] bg-black flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.05, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="text-white text-2xl font-bold tracking-widest"
          >
            90<span className="text-[#E50914]">+</span>5
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
