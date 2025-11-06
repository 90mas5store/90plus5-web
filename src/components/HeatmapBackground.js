"use client";
import { motion } from "framer-motion";
import { useMemo, useState, useEffect } from "react";

export default function HeatmapBackground({ liga = "default", opacity = 0.25 }) {
  const colorMap = {
    LaLiga: ["#E50914", "#FFB800"],
    "Premier League": ["#7F00FF", "#FF00A1"],
    "Serie A": ["#00FFA3", "#0077FF"],
    Bundesliga: ["#FF4500", "#FFD700"],
    MLS: ["#00C2FF", "#FF00A1"],
    "Ligue 1": ["#00FF88", "#0040FF"],
    "Liga Hondubet": ["#E50914", "#FFFFFF"],
    default: ["#E50914", "#651FFF"],
  };

  const [heatSpots, setHeatSpots] = useState([]);
  const [particles, setParticles] = useState([]);
  const [mounted, setMounted] = useState(false);

  const [c1, c2] = colorMap[liga] || colorMap.default;

  // ⚙️ Solo generar spots en cliente
  useEffect(() => {
    setMounted(true);

    const newSpots = Array.from({ length: 5 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 100 + Math.random() * 200,
      delay: Math.random() * 5,
      duration: 8 + Math.random() * 4,
    }));

    const newParticles = Array.from({ length: 10 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 4,
      duration: 6 + Math.random() * 6,
    }));

    setHeatSpots(newSpots);
    setParticles(newParticles);
  }, [liga]);

  if (!mounted) return null; // Evita que SSR genere el mapa

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      className="absolute inset-0 overflow-hidden z-0"
    >
      {/* Fondo radial base */}
      <svg
        className="absolute w-full h-full mix-blend-soft-light"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="heatGradient" cx="50%" cy="50%" r="80%">
            <stop offset="0%" stopColor={c1} stopOpacity="0.8" />
            <stop offset="50%" stopColor={c2} stopOpacity="0.5" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#heatGradient)" />
      </svg>

      {/* 🔥 Zonas animadas */}
      {heatSpots.map((spot, i) => (
        <motion.div
          key={`spot-${i}`}
          className="absolute rounded-full blur-[120px]"
          style={{
            background: `radial-gradient(circle, ${c1}AA, transparent 70%)`,
            width: `${spot.size}px`,
            height: `${spot.size}px`,
            left: `${spot.x}%`,
            top: `${spot.y}%`,
            opacity: 0.4,
          }}
          animate={{
            x: ["0%", "10%", "-5%", "0%"],
            y: ["0%", "-8%", "5%", "0%"],
            opacity: [0.3, 0.5, 0.4, 0.3],
          }}
          transition={{
            duration: spot.duration,
            delay: spot.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* ✨ Partículas flotantes */}
      {particles.map((p, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-2 h-2 rounded-full blur-sm"
          style={{
            backgroundColor: c2,
            left: `${p.x}%`,
            top: `${p.y}%`,
            opacity: 0.2,
          }}
          animate={{
            y: ["0%", "-30%", "10%", "0%"],
            opacity: [0.1, 0.4, 0.2, 0.1],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </motion.div>
  );
}
