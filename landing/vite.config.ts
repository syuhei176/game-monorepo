import { defineConfig } from 'vite'

export default defineConfig({
  base: '/game-monorepo/',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    port: 3001,
    open: true,
  },
})
