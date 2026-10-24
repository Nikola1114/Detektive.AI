/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#07090d",
        night: "#0c1018",
        navy: { 900: "#0a101b", 800: "#101a2a", 700: "#17243a", 600: "#22324d" },
        char: { 900: "#0f1013", 800: "#16171b", 700: "#1e2026", 600: "#2a2c33", 500: "#3a3d46" },
        amber: { 300: "#f3cf85", 400: "#e7b45a", 500: "#d39a3a", 600: "#a8752a", 700: "#6e4c1d" },
        paper: { 100: "#f4ecdc", 200: "#e9dec7", 300: "#d8c9aa", 400: "#bba985" },
        smoke: { 100: "#e7e3da", 200: "#c9c4b8", 300: "#a39e92", 400: "#7d786e", 500: "#5c5850" },
        blood: { 400: "#d0564e", 500: "#b23a33", 600: "#8a2a25" },
        steel: { 300: "#9fb3cc", 400: "#7d95b5", 500: "#5c7598" },
        pencil: "#9a8f7a",
      },
      fontFamily: {
        display: ['"Playfair Display"', "Georgia", "serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
        type: ['"Special Elite"', '"Courier New"', "monospace"],
        hand: ['"Caveat"', '"Segoe Print"', "cursive"],
      },
      boxShadow: {
        lamp: "0 0 120px 20px rgba(231,180,90,0.10)",
        card: "0 10px 30px -10px rgba(0,0,0,0.8), 0 2px 6px rgba(0,0,0,0.5)",
        glow: "0 0 0 1px rgba(231,180,90,0.5), 0 0 24px rgba(231,180,90,0.25)",
      },
      keyframes: {
        flicker: { "0%,100%": { opacity: "1" }, "92%": { opacity: "1" }, "93%": { opacity: "0.6" }, "94%": { opacity: "1" }, "96%": { opacity: "0.8" } },
        pulseRing: { "0%": { transform: "scale(0.9)", opacity: "0.7" }, "100%": { transform: "scale(1.5)", opacity: "0" } },
      },
      animation: { flicker: "flicker 6s infinite", pulseRing: "pulseRing 1.8s ease-out infinite" },
    },
  },
  plugins: [],
};
