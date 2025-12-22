// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: process.env.VITE_PORT || 5000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://10.0.0.65:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});