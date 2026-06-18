import { defineConfig } from 'vite'

export default defineConfig({
  base: '/game-monorepo/towndash/',
  build: {
    // esnext: skip syntax down-levelling. The repo-wide esbuild security
    // override (>=0.25) pulls an esbuild that can't transpile Three.js's
    // destructuring for Vite 5's default target; modern browsers need no
    // transform, so target the latest and let esbuild leave the syntax as-is.
    target: 'esnext',
    outDir: '../../dist/towndash',
    emptyOutDir: true,
  },
  server: {
    port: 3002,
    open: true,
  },
  assetsInclude: ['**/*.glb'],
})
