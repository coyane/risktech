import { defineConfig } from '@playwright/test'

const PORT = 4173

// Pruebas de interfaz: recorren la aplicación compilada en un navegador real.
// Usan el Chrome instalado en la máquina, así no hay que descargar navegadores.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: 'list',
  timeout: 60_000,
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: 'chrome',
    locale: 'es-CL',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  // Las dos medidas que se revisan en cada cambio de interfaz.
  projects: [
    { name: 'escritorio', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'movil', use: { viewport: { width: 375, height: 800 } } },
  ],
})
