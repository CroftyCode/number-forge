import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Relative so the build runs from any sub-path, not just a domain root.
  // GitHub Pages serves this from /number-forge/.
  base: './',
  plugins: [react(), tailwindcss()]
})
