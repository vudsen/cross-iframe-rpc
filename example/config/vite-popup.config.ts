import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  base: '/popup',
  plugins: [react()],
  server: {
    port: 17000,
    strictPort: true
  },
  build: {
    rollupOptions: {
      input: 'popup.html',
      output: {
        dir: 'extension/popup'
      }
    },
  },
})
