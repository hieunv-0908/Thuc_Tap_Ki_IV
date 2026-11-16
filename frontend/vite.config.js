import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendTarget =
    env.VITE_BACKEND_URL && env.VITE_BACKEND_URL.startsWith('http')
      ? env.VITE_BACKEND_URL
      : (env.VITE_API_URL && env.VITE_API_URL.startsWith('http')
          ? env.VITE_API_URL
          : 'http://localhost:8080')

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
