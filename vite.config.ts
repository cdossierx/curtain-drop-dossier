import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import devServer, { defaultOptions } from "@hono/vite-dev-server";

export default defineConfig({
  plugins: [
    react(),
    devServer({
      entry: "boot.ts",
      // Let Vite keep serving the React app; Hono should only own API routes.
      exclude: [/^(?!\/api(?:\/|$)).*/, ...defaultOptions.exclude],
    }),
  ],
  
  
  
  

  server: {
    host: "0.0.0.0",
    allowedHosts: ["localhost", "127.0.0.1", "curtain-drop-dossier-web.onrender.com"]
  },

  preview: {
    host: "0.0.0.0",
    allowedHosts: ["localhost", "127.0.0.1", "curtain-drop-dossier-web.onrender.com"]
  },

  resolve: {
    alias: {
      "@": path.resolve(process.cwd()),
      "@db": path.resolve(process.cwd()),
    },
  },
});