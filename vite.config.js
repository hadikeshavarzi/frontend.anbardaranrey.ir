import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
  },

  server: {
    host: "0.0.0.0",
    allowedHosts: [
      "portal.anbardaranrey.ir",
      "www.portal.anbardaranrey.ir"
    ]
  }
})
