// enables react and tailwind by 

import tailwindcss from '@tailwindcss/vite' // vite plugin of tailwindcss (allows me to style my compoenets using class names)  
import react from '@vitejs/plugin-react' // react plugin for vite (allows me to use jsx/tsx syntax in my components)
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {                  // development proxy forwards browser reqs from /api on 5137 to to backend at 5000
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
