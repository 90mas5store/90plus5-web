"use client";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

export default function HeatmapPitch({ opacity = 0.35 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

    const colors = [
      { r: 229, g: 9, b: 20 },   // rojo (alta intensidad)
      { r: 255, g: 184, b: 0 },  // amarillo
      { r: 0, g: 255, b: 128 },  // verde-azul
    ];

    // Función para dibujar el mapa de calor
    function drawHeat() {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < 6; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radius = 200 + Math.random() * 300;
        const color = colors[Math.floor(Math.random() * colors.length)];

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, `rgba(${color.r},${color.g},${color.b},0.4)`);
        gradient.addColorStop(1, "rgba(0,0,0,0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    drawHeat();
    const interval = setInterval(drawHeat, 4000); // cambia el patrón cada 4s

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {/* 🎯 Canvas dinámico */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-40" />

      {/* 🏟️ Trazado del campo (SVG) */}
      <motion.svg
        className="absolute inset-0 w-full h-full mix-blend-soft-light"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 60"
        preserveAspectRatio="none"
        initial={{ opacity: 0 }}
        animate={{ opacity }}
        transition={{ duration: 1.5 }}
      >
        <rect x="0" y="0" width="100" height="60" fill="none" stroke="#FFFFFF22" strokeWidth="0.5" />
        <line x1="50" y1="0" x2="50" y2="60" stroke="#FFFFFF22" strokeWidth="0.5" />
        <circle cx="50" cy="30" r="5" stroke="#FFFFFF22" fill="none" strokeWidth="0.5" />
        <rect x="0" y="20" width="6" height="20" stroke="#FFFFFF22" fill="none" strokeWidth="0.5" />
        <rect x="94" y="20" width="6" height="20" stroke="#FFFFFF22" fill="none" strokeWidth="0.5" />
      </motion.svg>

      {/* Gradiente oscuro para integración con el diseño */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
    </div>
  );
}

