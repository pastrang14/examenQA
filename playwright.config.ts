import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Carpeta donde buscará las pruebas
  testDir: './tests',
  
  // Tiempo máximo por prueba (30 segundos)
  timeout: 30 * 1000,

  // Genera un reporte en HTML sin abrirlo automáticamente
  reporter: [['html', { open: 'never' }]],

  // Configuración de evidencias
  use: {
    trace: 'on-first-retry',
    screenshot: 'on', // Tomará screenshot al final de la prueba
    video: 'on',      // Grabará un video de toda la ejecución
  },

  // Ejecutar solo en Chrome para este ejercicio
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});