import { defineConfig } from 'vite'

export default defineConfig({
  base: '/game-monorepo/reversi/',
  build: {
    // esnext: skip syntax down-levelling. The repo-wide esbuild security
    // override (>=0.25) pulls an esbuild that can't transpile Excalibur's
    // destructuring for Vite 5's default target; modern browsers need no
    // transform, so target the latest and let esbuild leave the syntax as-is.
    target: 'esnext',
    outDir: '../../dist/reversi',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    open: true,
  },
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.bmp'],
})
