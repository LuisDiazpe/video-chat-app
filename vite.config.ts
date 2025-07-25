import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['redbird-fair-urgently.ngrok-free.app'],
  },
  build: {
    outDir: '../dist/client', // ⬅ importante: fuera de `frontend`
    emptyOutDir: false,        // ⬅ para no borrar tu `dist/server`
  },
})
