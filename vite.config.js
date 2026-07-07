import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // the Scene chunk (three.js) is lazy-loaded after first paint, so its
    // size doesn't block the story — raise the warning threshold accordingly
    chunkSizeWarningLimit: 1000,
  },
})
