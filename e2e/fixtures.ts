import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/** Carpeta en la que GitHub Pages publica el sitio (coincide con `base` en vite.config.ts). */
export const SITE = '/Proyecto-mate-discreta';

/** Dirección completa de una ruta interna de la aplicación. */
export const sitePath = (path: string) => `${SITE}${path}`;

/**
 * Prueba base: hace fallar la prueba si la página registra errores en la consola, lanza
 * excepciones, recibe un error al descargar un recurso o pide un recurso fuera de la carpeta del
 * sitio (lo que en GitHub Pages sería un enlace roto). Cada prueba arranca con el almacenamiento vacío.
 */
export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: [
    async ({ page }, provide) => {
      const errors: string[] = [];
      page.on('console', (message) => {
        // Los fallos de descarga se controlan abajo, con más detalle (la página 404 de una dirección
        // desconocida es intencional; un recurso con error, no).
        if (message.type() === 'error' && !message.text().startsWith('Failed to load resource')) errors.push(message.text());
      });
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('response', (response) => {
        if (response.status() >= 400 && response.request().resourceType() !== 'document') errors.push(`Recurso con error ${response.status()}: ${response.url()}`);
      });
      page.on('request', (request) => {
        const url = new URL(request.url());
        if (url.hostname === 'localhost' && !url.pathname.startsWith(`${SITE}/`)) errors.push(`Recurso fuera de la carpeta del sitio: ${url.pathname}`);
      });
      await provide(errors);
      expect(errors, 'La página no debe registrar errores en la consola').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

export const MODULE_ROUTES = [
  { path: '/simulaciones/arboles-binarios', title: 'Árboles binarios' },
  { path: '/simulaciones/grafos', title: 'Teoría de grafos' },
  { path: '/simulaciones/euler-hamilton', title: 'Euler y Hamilton' },
  { path: '/simulaciones/isomorfismo', title: 'Isomorfismo' },
  { path: '/simulaciones/dijkstra', title: 'Dijkstra' },
  { path: '/simulaciones/bfs-dfs', title: 'BFS y DFS' },
  { path: '/laboratorio', title: 'Laboratorio de práctica' },
] as const;

/** Abre una ruta y espera el título principal de la página. */
export async function openPage(page: Page, path: string, title: string) {
  await page.goto(sitePath(path));
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
}

/** Espera a que React Flow haya medido y mostrado todos los vértices del lienzo. */
export async function waitForCanvas(page: Page, scope = page.locator('body')) {
  await expect(scope.locator('.react-flow__node').first()).toBeVisible();
}

/** Ancho de página mayor que la ventana (desplazamiento horizontal indeseado). */
export async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
}
