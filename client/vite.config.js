import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy /api/* requests to backend in development
      "/api": {
        target: "http://localhost:5001",
        changeOrigin: true,
      },
    },
  },
});
