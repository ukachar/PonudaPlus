import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", // omogućava pristup s drugih uređaja
    port: 5173, // možeš promijeniti ako želiš drugi port
  },
});
