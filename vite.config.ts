import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    host: "0.0.0.0",
    allowedHosts: ["curtain-drop-dossier-production.up.railway.app"]
  },

  preview: {
    host: "0.0.0.0",
    allowedHosts: ["curtain-drop-dossier-production.up.railway.app"]
  },

  resolve: {
    alias: {
      "@": path.resolve(process.cwd()),
    },
  },
});