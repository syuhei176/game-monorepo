import { defineConfig } from 'vite'

export default defineConfig({
  base: '/game-monorepo/reversi/',
  build: {
    outDir: '../../dist/reversi',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    open: true,
  },
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.bmp'],
})
