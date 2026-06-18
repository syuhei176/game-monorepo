import { defineConfig } from 'vite'

export default defineConfig({
  base: '/game-monorepo/sandsim/',
  build: {
    // esnext: skip syntax down-levelling. The repo-wide esbuild security
    // override (>=0.25) pulls an esbuild that can't transpile this game's
    // destructuring for Vite 5's default target; modern browsers need no
    // transform, so target the latest and let esbuild leave the syntax as-is.
    target: 'esnext',
    outDir: '../../dist/sandsim',
    emptyOutDir: true,
  },
  server: {
    port: 3002,
    open: true,
  },
})
