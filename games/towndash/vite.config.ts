import { defineConfig } from 'vite'

export default defineConfig({
  base: '/game-monorepo/towndash/',
  build: {
    outDir: '../../dist/towndash',
    emptyOutDir: true,
  },
  server: {
    port: 3002,
    open: true,
  },
  assetsInclude: ['**/*.glb'],
})
