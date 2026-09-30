import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 5173,
    hmr: false,
    // Allow the managed Freebuff preview host (*.e2b.app); the sandbox id can
    // change between restarts, so allow the whole preview domain.
    allowedHosts: [".e2b.app"],
  },
});
