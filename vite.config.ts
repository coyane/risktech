import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Las pruebas de interfaz de e2e/ las corre Playwright (npm run test:ui).
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
  },
})
