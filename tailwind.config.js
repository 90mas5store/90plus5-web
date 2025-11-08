/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/context/**/*.{js,ts,jsx,tsx}",
  ],
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
    },
  },
  plugins: [],
};
