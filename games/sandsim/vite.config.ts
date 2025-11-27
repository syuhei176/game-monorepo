import { defineConfig } from 'vite'

export default defineConfig({
  base: '/game-monorepo/sandsim/',
  build: {
    outDir: '../../dist/sandsim',
    emptyOutDir: true,
  },
  server: {
    port: 3002,
    open: true,
  },
})
