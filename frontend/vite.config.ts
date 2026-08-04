// enables react and tailwind by 

import tailwindcss from '@tailwindcss/vite' // to style my components using class names
import react from '@vitejs/plugin-react' // to use jsx/tsx syntax in my components
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
