import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const backendPortFile = path.resolve(__dirname, '../server/.cache/backend-port.json')

const readBackendTarget = () => {
  try {
    if (fs.existsSync(backendPortFile)) {
      const parsed = JSON.parse(fs.readFileSync(backendPortFile, 'utf8'))
      if (parsed?.port) return `http://127.0.0.1:${parsed.port}`
    }
  } catch {
    // Fall back to the default backend port if the cache is missing or invalid.
  }

  return 'http://127.0.0.1:5001'
}

const backendTarget = readBackendTarget()

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      // Forward all /api requests to the Express backend
      '/api': {
        target: backendTarget,
        changeOrigin: true,
        secure: false,
      },
      // Forward Socket.IO connections
      '/socket.io': {
        target: backendTarget,
        changeOrigin: true,
        ws: true,
        secure: false,
      },
    },
  },
})
