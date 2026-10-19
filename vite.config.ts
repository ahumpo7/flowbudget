import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: './', // Enables seamless deployment on GitHub Pages or any sub-path
  plugins: [
    react(),
    tailwindcss(),
  ],
})
