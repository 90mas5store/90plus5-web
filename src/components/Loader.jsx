"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function Loader({ show = true, text = "Cargando..." }) {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    if (show) setVisible(true);
    else {
      const timer = setTimeout(() => setVisible(false), 400); // espera animación de salida
      return () => clearTimeout(timer);
    }
  }, [show]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black"
        >
          {/* Aura del fondo */}
          <motion.div
            className="absolute w-[600px] h-[600px] rounded-full bg-[#E50914] blur-[120px] opacity-20"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Logo con leve glow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative z-10 flex flex-col items-center"
          >
            <Image
              src="/logo.png"
              alt="90+5 Store"
              width={96}
              height={96}
              priority
              className="drop-shadow-[0_0_12px_rgba(229,9,20,0.7)]"
            />
            <h1 className="mt-3 text-white text-2xl font-satoshi font-bold tracking-tight">
              90<span className="text-[#E50914]">+</span>5
            </h1>
            <p className="text-gray-400 text-sm mt-2">{text}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
