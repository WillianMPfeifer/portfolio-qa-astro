import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { crawlSite } from './support/crawler';

test.use({ reducedMotion: 'reduce' });

test('every discovered route has no serious accessibility violations', async ({ page, baseURL }) => {
  const { routes } = await crawlSite(page, baseURL ?? 'http://localhost:4321');

  for (const route of routes) {
    await page.goto(route.path);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  }
});
