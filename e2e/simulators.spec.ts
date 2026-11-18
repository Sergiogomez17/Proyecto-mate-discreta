import type { Page } from '@playwright/test';
import { expect, openPage, test, waitForCanvas } from './fixtures';

/** Elige la velocidad máxima y reproduce automáticamente hasta el final. */
async function playFast(page: Page) {
  await page.getByLabel('Velocidad').selectOption({ label: 'Muy rápida' });
  await page.getByRole('button', { name: 'Iniciar', exact: true }).click();
}

test.describe('simuladores en reproducción automática', () => {
  test('árboles: el recorrido inorden se anima hasta el resultado', async ({ page }) => {
    await openPage(page, '/simulaciones/arboles-binarios', 'Árboles binarios');
    await page.getByRole('tab', { name: 'Inorden' }).click();
    await playFast(page);
    await expect(page.getByTestId('final-result')).toHaveText('a + b · c − d', { timeout: 20_000 });
  });

  test('Dijkstra: ejecuta solo y resalta el camino mínimo', async ({ page }) => {
    await openPage(page, '/simulaciones/dijkstra', 'Dijkstra');
    await waitForCanvas(page);
    await page.getByLabel('Destino').selectOption({ label: 'F' });
    await playFast(page);
    await expect(page.getByTestId('dijkstra-result')).toContainText('Camino mínimo de A a F: costo 12', { timeout: 20_000 });
    await expect(page.getByTestId('dijkstra-result')).toContainText('A → C → B → D → E → F');
    // Las aristas del camino se dibujan con el color de «camino mínimo».
    await expect(page.locator('.react-flow__edge-path[style*="rgb(91, 33, 182)"]')).toHaveCount(5);
  });

  test('BFS y DFS: los recorridos terminan con todos los vértices', async ({ page }) => {
    await openPage(page, '/simulaciones/bfs-dfs', 'BFS y DFS');
    await waitForCanvas(page);
    await playFast(page);
    await expect(page.getByTestId('traversal-result')).toContainText('Se visitaron los 10 vértices', { timeout: 25_000 });
  });

  test('Euler: Fleury recorre la casa y el lienzo marca las aristas usadas', async ({ page }) => {
    await openPage(page, '/simulaciones/euler-hamilton', 'Euler y Hamilton');
    await waitForCanvas(page);
    const analysis = page.getByRole('region', { name: 'Análisis' });
    await analysis.getByLabel('Vértice inicial').selectOption({ label: 'B' });
    await analysis.getByRole('button', { name: 'Comenzar recorrido' }).click();
    // Una arista elegida con un clic en el lienzo.
    await page.locator('.react-flow__edge[data-id="e1"] .react-flow__edge-interaction').click({ force: true });
    await expect(page.getByTestId('fleury-current')).toHaveText('A');
    await analysis.getByRole('button', { name: 'Completar con Fleury' }).click();
    await expect(page.getByTestId('fleury-result')).toContainText('Camino euleriano completo');
  });

  test('Isomorfismo: encuentra y verifica una correspondencia', async ({ page }) => {
    await openPage(page, '/simulaciones/isomorfismo', 'Isomorfismo');
    await page.getByRole('button', { name: 'Comprobar isomorfismo' }).click();
    await expect(page.getByTestId('iso-result')).toContainText('G1 y G2 son isomorfos');
    await page.getByRole('button', { name: 'Usar como propuesta' }).click();
    await expect(page.getByTestId('mapping-check')).toContainText('La correspondencia es un isomorfismo');
  });
});

test.describe('laboratorio de práctica', () => {
  test('califica, guarda el historial y solo muestra la solución después de comprobar', async ({ page }) => {
    await openPage(page, '/laboratorio', 'Laboratorio de práctica');
    await page.getByLabel('Tema').selectOption({ label: 'Hamilton' });
    await page.getByRole('button', { name: 'Generar ejercicio' }).click();
    await expect(page.getByRole('button', { name: 'Ver solución' })).toBeDisabled();
    await page.getByRole('button', { name: 'Comprobar respuesta' }).click();
    await expect(page.getByTestId('score')).toHaveText('0 %');
    await page.getByRole('button', { name: 'Ver solución' }).click();
    await expect(page.getByTestId('solution')).toContainText('Un ciclo hamiltoniano:');
    await expect(page.getByTestId('history')).toContainText('Hamilton · Básico');
    await page.reload();
    await expect(page.getByTestId('history')).toContainText('Hamilton · Básico');
  });
});
