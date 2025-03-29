import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import { config } from "dotenv";
import tailwindcss from "@tailwindcss/vite";

config()

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
})
