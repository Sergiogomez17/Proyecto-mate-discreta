import { expect, openPage, test, waitForCanvas } from './fixtures';

test.describe('editor de grafos con ratón y teclado reales', () => {
  test.skip(({ isMobile }) => isMobile, 'Arrastre y teclado: en escritorio');

  test('crea vértices y aristas con clics, arrastra, elimina con Supr, deshace y conserva el grafo', async ({ page }) => {
    await openPage(page, '/simulaciones/grafos', 'Teoría de grafos');
    await waitForCanvas(page);
    const results = page.getByRole('region', { name: 'Resultados' });
    const stat = (label: string) => results.locator('dt', { hasText: label }).locator('xpath=following-sibling::dd[1]');

    // Grafo vacío.
    await page.getByRole('button', { name: 'Reiniciar grafo' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Reiniciar' }).click();
    await expect(page.locator('.react-flow__node')).toHaveCount(0);

    // Tres vértices con clics en el lienzo.
    const canvas = page.getByRole('region', { name: 'Lienzo del grafo' });
    await page.getByRole('button', { name: 'Agregar vértices' }).click();
    // Se mide después del clic anterior, que pudo desplazar la página.
    await canvas.scrollIntoViewIfNeeded();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('El lienzo no tiene tamaño');
    const points = [
      [0.25, 0.3],
      [0.7, 0.3],
      [0.5, 0.75],
    ] as const;
    for (const [fx, fy] of points) await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy);
    await expect(page.locator('.react-flow__node')).toHaveCount(3);
    await expect(stat('Vértices |V|')).toHaveText('3');

    // Dos aristas: A–B y B–C, con dos clics cada una. La posición del lienzo no debe moverse entre clics.
    await page.getByRole('button', { name: 'Agregar aristas' }).click();
    const node = (label: string) => page.locator('.react-flow__node', { hasText: new RegExp(`^${label}$`) });
    await node('A').click();
    await node('B').click();
    await node('B').click();
    await node('C').click();
    await expect(stat('Aristas |E|')).toHaveText('2');
    await expect(page.getByText('Se agregó la arista B — C')).toBeVisible();

    // Arrastrar A cambia su posición.
    await page.getByRole('button', { name: 'Seleccionar y mover' }).click();
    const before = await node('A').boundingBox();
    if (!before) throw new Error('A no tiene tamaño');
    await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
    await page.mouse.down();
    await page.mouse.move(before.x + 80, before.y + 60, { steps: 8 });
    await page.mouse.up();
    const after = await node('A').boundingBox();
    expect(Math.round((after?.x ?? 0) - before.x)).toBeGreaterThan(40);

    // Seleccionar C y eliminarlo con Supr (pide confirmación).
    await node('C').click();
    await expect(page.getByRole('region', { name: 'Propiedades' }).getByRole('heading', { name: 'Vértice C' })).toBeVisible();
    await page.keyboard.press('Delete');
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toContainText('su arista incidente');
    await dialog.getByRole('button', { name: 'Eliminar' }).click();
    await expect(stat('Vértices |V|')).toHaveText('2');
    await expect(stat('Aristas |E|')).toHaveText('1');

    await page.getByRole('button', { name: 'Deshacer' }).click();
    await expect(stat('Vértices |V|')).toHaveText('3');

    // El grafo se guarda en el navegador.
    await page.reload();
    await waitForCanvas(page);
    await expect(page.locator('.react-flow__node')).toHaveCount(3);
    await expect(stat('Aristas |E|')).toHaveText('2');
  });

  test('importa un archivo JSON real y exporta el grafo', async ({ page }) => {
    await openPage(page, '/simulaciones/grafos', 'Teoría de grafos');
    await waitForCanvas(page);
    const json = JSON.stringify({ name: 'Cuadrado', vertices: ['P', 'Q', 'R', 'S'], edges: [{ source: 'P', target: 'Q' }, { source: 'Q', target: 'R' }, { source: 'R', target: 'S' }, { source: 'S', target: 'P' }] });
    await page.getByLabel('Archivo JSON del grafo').setInputFiles({ name: 'cuadrado.json', mimeType: 'application/json', buffer: Buffer.from(json) });
    await page.getByRole('alertdialog').getByRole('button', { name: 'Importar' }).click();
    await expect(page.locator('.react-flow__node')).toHaveCount(4);

    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exportar JSON' }).click();
    const file = await download;
    expect(file.suggestedFilename()).toBe('cuadrado.json');
    const path = await file.path();
    const { readFile } = await import('node:fs/promises');
    const data = JSON.parse(await readFile(path, 'utf8')) as { vertices: unknown[]; edges: unknown[]; format: string };
    expect(data).toMatchObject({ format: 'graphlab-uvg/grafo' });
    expect(data.vertices).toHaveLength(4);
    expect(data.edges).toHaveLength(4);

    const png = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exportar PNG' }).click();
    expect((await png).suggestedFilename()).toBe('cuadrado.png');
  });
});
