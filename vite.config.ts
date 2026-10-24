import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // kokoro-js's default build targets Node (it imports fs/path); use its browser build instead.
      "kokoro-js": path.resolve(__dirname, "node_modules/kokoro-js/dist/kokoro.web.js"),
    },
  },
  // Pre-bundle the voice library at startup so the dev server doesn't reload the page mid-download.
  optimizeDeps: { include: ["kokoro-js"] },
  worker: { format: "es" },
  server: { port: 5173, proxy: { "/api": "http://localhost:8787" } },
  // Source maps are disabled so nothing beyond the shipped UI code is downloadable.
  build: { sourcemap: false, outDir: "dist" },
});
