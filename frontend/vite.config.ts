import tailwindcss from '@tailwindcss/vite' 
import react from '@vitejs/plugin-react' 
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {                  // development proxy forwards browser reqs from /api on 5173 to to backend at 5000
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
