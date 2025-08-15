import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/opus-media-recorder/encoderWorker.min.js',
          dest: 'lib',
        },
        {
          src: 'node_modules/opus-media-recorder/OpusMediaRecorder.wasm',
          dest: 'lib',
        },
      ],
    }),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['redbird-fair-urgently.ngrok-free.app'],
  },
  build: {
    outDir: '../dist/client', // fuera del front
    emptyOutDir: false,        // no borrar dist/server
  },

  assetsInclude: ['**/*.wasm'],

  define: {
    global: 'window', // evitar errores de opus
  },

})
