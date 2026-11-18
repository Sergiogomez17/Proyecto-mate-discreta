import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Prueba base: registra los errores de la consola y las excepciones de la página, y hace fallar
 * la prueba si aparece alguno. Cada prueba arranca con el almacenamiento local vacío.
 */
export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: [
    async ({ page }, provide) => {
      const errors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      page.on('pageerror', (error) => errors.push(error.message));
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
  await page.goto(path);
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
