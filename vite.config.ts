import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' so a production build can also be opened from the filesystem / any subpath.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5180,
    open: true,
  },
})
