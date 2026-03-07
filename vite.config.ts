import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  root: 'examples',
  base: '/',
  plugins: [vue()],
  resolve: {
    alias: [
      {
        find: /^@syropian\/autotile\/(.+)$/,
        replacement: fileURLToPath(new URL('./src/$1.ts', import.meta.url)),
      },
    ],
  },
  build: {
    outDir: '../example-dist',
    emptyOutDir: true,
  },
})
