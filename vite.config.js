import { defineConfig } from 'vite'
import { createVuePlugin } from 'vite-plugin-vue2'

// https://vite.dev/config/
export default defineConfig({
  plugins: [createVuePlugin()],
  base: '/rc-calculator',
  server: {
    allowedHosts: ['.ngrok-free.app', '.ngrok.io', 'localhost', '.github.io']
  }
})
