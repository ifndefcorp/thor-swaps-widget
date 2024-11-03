import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/thorchain': {
        target: 'https://midgard.ninerealms.com/v2',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/thorchain/, '')
      }
    }
  },
  css: {
    modules: false,
  }
})