import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
 plugins: [react()],
 
 server: {
9     host: "0.0.0.0",
10    allowedHosts: ["curtain-drop-dossier-production.up.railway.app"]
11  },
12
13  preview: {
14    host: "0.0.0.0",
15    allowedHosts: ["curtain-drop-dossier-production.up.railway.app"]
16  },
17
18  resolve: {