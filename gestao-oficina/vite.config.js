import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    // diretorio do dist
    // base: '/',
    plugins: [react(), basicSsl()],
    server: {
      host: env.VITE_HOST || '0.0.0.0',
      port: parseInt(env.VITE_PORT) || 5173,
      strictPort: true
    },
    preview: {
      host: env.VITE_HOST || true,
      port: parseInt(env.VITE_PORT) || 5173,
      strictPort: true
    }
  }
})
