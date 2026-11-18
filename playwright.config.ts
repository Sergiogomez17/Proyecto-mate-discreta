import { defineConfig, devices } from '@playwright/test';

/**
 * Pruebas de interfaz de punta a punta sobre la compilación de producción (`vite preview`).
 *
 * Navegador: por defecto se usa Microsoft Edge instalado en el equipo (no hay que descargar nada).
 * Con PW_CHANNEL=chrome se usa Google Chrome, y con PW_CHANNEL=chromium el Chromium de Playwright
 * (requiere `npx playwright install chromium`; es lo habitual en integración continua).
 */
const channel = process.env.PW_CHANNEL ?? 'msedge';
const browser = channel === 'chromium' ? {} : { channel };
const PORT = 4173;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  timeout: 30_000,
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'es-GT',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'], ...browser } },
    { name: 'movil', use: { ...devices['Pixel 7'], ...browser } },
  ],
});
