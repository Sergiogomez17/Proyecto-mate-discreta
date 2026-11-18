import AxeBuilder from '@axe-core/playwright';
import { expect, MODULE_ROUTES, openPage, test } from './fixtures';

const ROUTES = [{ path: '/', title: 'GraphLab UVG' }, { path: '/simulaciones', title: 'Simuladores de grafos y árboles' }, { path: '/ayuda', title: 'Guía de uso de GraphLab' }, ...MODULE_ROUTES];

test.describe('accesibilidad (axe-core, WCAG 2.1 A y AA)', () => {
  for (const route of ROUTES) {
    test(`${route.path} no tiene problemas graves de accesibilidad`, async ({ page }) => {
      await openPage(page, route.path, route.title);
      await page.waitForLoadState('networkidle');
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const serious = results.violations
        .filter((v) => v.impact === 'serious' || v.impact === 'critical')
        .map((v) => `${v.id} (${v.impact}): ${v.help} → ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
      expect(serious).toEqual([]);
    });
  }
});
