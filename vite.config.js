import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  // We removed "esbuild: false" so the build actually works.
  // We removed the manual "wasmLoader" because package.json overrides handle it now.

  server: {
    host: "0.0.0.0",
    allowedHosts: [
      "portal.anbardaranrey.ir",
      "www.portal.anbardaranrey.ir"
    ]
  }
})
