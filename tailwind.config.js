/** @type {import('tailwindcss').Config} */
module.exports = {
  // ✅ Escaneo completo de archivos relevantes
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/context/**/*.{js,ts,jsx,tsx}",
    "./src/lib/**/*.{js,ts,jsx,tsx}",
  ],

  // ✅ Fijar modo oscuro (no depende de preferencias del sistema)
  darkMode: "class",

  theme: {
    extend: {
      colors: {
        primary: "#E50914", // rojo 90+5
        secondary: "#000000",
        accent: "#651FFF",
        background: "#0A0A0A",
        textLight: "#FFFFFF",
        textDark: "#111111",
      },

      fontFamily: {
        satoshi: ["var(--font-satoshi)", "sans-serif"],
      },

      // 💫 Sombras y glows personalizados para las "auras"
      boxShadow: {
        glowRed: "0 0 25px rgba(229,9,20,0.3)",
        glowWhite: "0 0 20px rgba(255,255,255,0.1)",
        glowSoft: "0 0 35px rgba(255,255,255,0.06)",
      },

      // 🌌 Gradientes suaves reutilizables para fondo de aura
      backgroundImage: {
        "aura-90plus5":
          "linear-gradient(to bottom, rgba(229,9,20,0.25), rgba(0,0,0,0.9))",
        "aura-olimpia":
          "linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(229,9,20,0.35))",
        "aura-barcelona":
          "linear-gradient(to bottom, rgba(0,77,152,0.4), rgba(165,0,68,0.4), rgba(0,0,0,0.85))",
      },
    },
  },

  plugins: [],
};

