import { expect, horizontalOverflow, MODULE_ROUTES, openPage, sitePath, test } from './fixtures';

test.describe('navegación y diseño responsive', () => {
  test('el inicio muestra la identidad y el orden Inicio → Laboratorio → Simulaciones', async ({ page, isMobile }) => {
    await openPage(page, '/', 'GraphLab UVG');
    await expect(page.getByText('UVG Campus Altiplano · Matemática Discreta')).toBeVisible();
    if (isMobile) await page.getByRole('button', { name: 'Abrir menú' }).click();
    const nav = page.getByRole('navigation', { name: isMobile ? 'Navegación principal (móvil)' : 'Navegación principal' });
    await expect(nav.getByRole('link')).toHaveText(['Inicio', 'Laboratorio', 'Simulaciones', 'Ayuda']);
  });

  test('cada tarjeta del inicio abre su módulo', async ({ page }) => {
    await openPage(page, '/', 'GraphLab UVG');
    const modules = page.getByRole('region', { name: 'Módulos del laboratorio' });
    for (const route of MODULE_ROUTES) {
      await modules.getByRole('link', { name: new RegExp(route.title) }).first().click();
      await expect(page).toHaveURL(new RegExp(`${sitePath(route.path)}/?$`));
      await expect(page.getByRole('heading', { level: 1, name: route.title })).toBeVisible();
      await page.goBack();
      await expect(page.getByRole('heading', { level: 1, name: 'GraphLab UVG' })).toBeVisible();
    }
  });

  for (const route of MODULE_ROUTES) {
    test(`${route.path} funciona al abrirse directamente y no se desborda`, async ({ page }) => {
      await openPage(page, route.path, route.title);
      // Se espera a que termine de dibujarse (lienzos incluidos) antes de medir.
      await page.waitForLoadState('networkidle');
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
      await page.reload();
      await expect(page.getByRole('heading', { level: 1, name: route.title })).toBeVisible();
    });
  }

  test('las rutas desconocidas muestran la página 404', async ({ page }) => {
    await openPage(page, '/no-existe', 'Página no encontrada');
  });

  test('el menú móvil se abre, navega y se cierra', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Solo en móvil');
    await openPage(page, '/', 'GraphLab UVG');
    await page.getByRole('button', { name: 'Abrir menú' }).click();
    await page.getByRole('navigation', { name: 'Navegación principal (móvil)' }).getByRole('link', { name: 'Laboratorio' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Laboratorio de práctica' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Abrir menú' })).toHaveAttribute('aria-expanded', 'false');
  });

  test('se puede recorrer el inicio con el teclado y el enlace «Saltar al contenido» funciona', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Teclado físico: solo en escritorio');
    await openPage(page, '/', 'GraphLab UVG');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: /Saltar al contenido/ });
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
  });
});

test('«Borrar todos los datos» elimina proyectos e historial guardados', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Basta con escritorio');
  await openPage(page, '/simulaciones/grafos', 'Teoría de grafos');
  const project = page.getByRole('region', { name: 'Proyecto' });
  await project.getByRole('button', { name: 'Guardar en el navegador' }).click();
  await expect(project.getByText('Proyectos guardados (1/20)')).toBeVisible();

  await openPage(page, '/ayuda', 'Guía de uso de GraphLab');
  await page.getByRole('button', { name: 'Borrar todos los datos de GraphLab' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Borrar todo' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Guía de uso de GraphLab' })).toBeVisible();
  expect(await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('graphlab-uvg:') && k !== 'graphlab-uvg:preferences'))).toEqual([]);

  await openPage(page, '/simulaciones/grafos', 'Teoría de grafos');
  await expect(page.getByRole('region', { name: 'Proyecto' }).getByText('Proyectos guardados (0/20)')).toBeVisible();
});

test.describe('publicación en GitHub Pages', () => {
  test('cada ruta interna existe como página estática y las desconocidas usan 404.html', async ({ request }) => {
    for (const path of ['/', '/simulaciones', '/ayuda', ...MODULE_ROUTES.map((r) => r.path)]) {
      const response = await request.get(sitePath(path === '/' ? '/' : `${path}/`));
      expect(response.status(), path).toBe(200);
    }
    expect((await request.get(sitePath('/no-existe'))).status()).toBe(404);
  });

  test('una dirección interna sin barra final se redirige y la aplicación muestra el módulo', async ({ page }) => {
    await page.goto(sitePath('/simulaciones/dijkstra'));
    await expect(page).toHaveURL(new RegExp(`${sitePath('/simulaciones/dijkstra')}/$`));
    await expect(page.getByRole('heading', { level: 1, name: 'Dijkstra' })).toBeVisible();
    // La navegación interna sigue funcionando desde una página servida desde una subcarpeta.
    await page.getByRole('navigation', { name: 'Ruta de navegación' }).getByRole('link', { name: 'Simulaciones' }).click();
    await expect(page).toHaveURL(new RegExp(`${sitePath('/simulaciones')}$`));
    await expect(page.getByRole('heading', { level: 1, name: 'Simuladores de grafos y árboles' })).toBeVisible();
  });

  test('una dirección desconocida muestra la página 404 propia', async ({ page }) => {
    await page.goto(sitePath('/simulaciones/no-existe'));
    await expect(page.getByRole('heading', { level: 1, name: 'Página no encontrada' })).toBeVisible();
    await page.getByRole('link', { name: 'Volver al inicio' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'GraphLab UVG' })).toBeVisible();
  });
});
