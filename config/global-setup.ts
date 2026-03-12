import { test as base } from '@playwright/test';

/**
 * Extended test fixture with automatic wait for content loading
 * This ensures all images and dynamic content are fully loaded before screenshots
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    // Intercept page navigation to add waits
    const originalGoto = page.goto.bind(page);
    page.goto = async (url: string, options?: any) => {
      const response = await originalGoto(url, options);

      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {
        console.log('Network idle timeout reached, continuing...');
      });

      // Wait for all images to load
      await page.evaluate(async () => {
        const images = Array.from(document.images);
        await Promise.all(
          images.map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise((resolve) => {
              img.onload = img.onerror = resolve;
              // Timeout after 10 seconds per image
              setTimeout(resolve, 10000);
            });
          })
        );
      });

      // Additional wait for any lazy-loaded content
      await page.waitForTimeout(3000);

      return response;
    };

    await use(page);
  },
});

export { expect } from '@playwright/test';

