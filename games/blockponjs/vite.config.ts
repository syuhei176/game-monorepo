import { defineConfig } from 'vite'

export default defineConfig({
  base: '/game-monorepo/blockponjs/',
  build: {
    outDir: '../../dist/blockponjs',
    emptyOutDir: true,
  },
  server: {
    port: 3002,
    open: true,
  },
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.bmp'],
})
