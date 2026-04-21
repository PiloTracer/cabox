import { test, expect } from '@playwright/test';

/**
 * Verifies the public storefront does not grow wider than the viewport at common breakpoints.
 * Run with dev server up: PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npx playwright test
 */

const STORE_PATHS = ['/es', '/es/products', '/es/pages/envios', '/es/checkout'];

const VIEWPORTS = [
  { width: 360, height: 720, name: 'mobile-narrow' },
  { width: 390, height: 844, name: 'mobile-ios' },
  { width: 428, height: 926, name: 'mobile-large' },
  { width: 768, height: 1024, name: 'tablet' },
  { width: 1024, height: 768, name: 'tablet-landscape' },
  { width: 1280, height: 720, name: 'desktop' },
];

async function assertNoHorizontalOverflow(page: import('@playwright/test').Page) {
  const delta = await page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth - root.clientWidth;
  });
  expect(delta, 'document scrollWidth should not exceed clientWidth').toBeLessThanOrEqual(2);
}

for (const path of STORE_PATHS) {
  for (const vp of VIEWPORTS) {
    test(`${path} @ ${vp.name} (${vp.width}x${vp.height}) — no horizontal overflow`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const res = await page.goto(path, { waitUntil: 'domcontentloaded' });
      expect(res?.ok() ?? false, `HTTP ok for ${path}`).toBeTruthy();
      await assertNoHorizontalOverflow(page);
      await expect(page.locator('header.navbar')).toBeVisible();
      await expect(page.locator('main')).toBeVisible();
    });
  }
}
