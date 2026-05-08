import { defineConfig } from 'vite'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [
    crx({ manifest }),
  ],
  build: {
    rollupOptions: {
      input: {
        // Força o dashboard como entry point separado
        dashboard: resolve(__dirname, 'src/dashboard/dashboard.html'),
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: { port: 5173 },
  },
  resolve: {
    alias: {
      '@lib':        '/src/lib',
      '@components': '/src/components',
      '@styles':     '/src/styles',
    },
  },
})
