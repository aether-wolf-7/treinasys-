import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Proxy em desenvolvimento: o front chama /api e o Vite repassa para a API.
    // Evita CORS na dev e deixa o código igual ao de produção, onde o Nginx faz o mesmo.
    proxy: {
      '/api': { target: 'http://localhost:3333', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
