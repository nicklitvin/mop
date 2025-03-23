import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import { config } from "dotenv";
import tailwindcss from "@tailwindcss/vite";

config()

export default defineConfig({
  plugins: [react(), tailwindcss()],
//   server: {
//     port: Number(process.env.PORT),
//     host: process.env.HOST
//   },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
