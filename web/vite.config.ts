import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import { config } from "dotenv";

config()

export default defineConfig({
  plugins: [react()],
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
