import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,

    /**
     * Proxy — semua request /api/* di-forward ke backend.
     * Ini menyelesaikan masalah CORS di development.
     *
     * Browser request:  http://localhost:5173/api/antrian
     * Vite forward ke:  http://localhost:3000/api/antrian
     */
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
