import { test as base, Page } from '@playwright/test';
import type { ExtendedPage } from './types';
import type { ExtendedPage } from './types';

/**
 * and automatically capture screenshots for each step
 * Global test hooks to ensure all content is loaded before screenshots
export const test = base.extend<{ page: ExtendedPage }>({
  page: async ({ page }, use, testInfo) => {
    let stepCounter = 0;

export const test = base.extend<{ page: ExtendedPage }>({
    (page as any).waitForAllContent = async () => {
    let stepCounter = 0;
    const extendedPage = page as ExtendedPage;

    // Add a function to wait for all images and content to load
    extendedPage.waitForAllContent = async () => {
      // Wait for network to be idle
      await extendedPage.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {
        console.log('Network idle timeout, continuing...');
      });

      // Wait for all images to load
      await extendedPage.evaluate(async () => {
        const images = Array.from(document.images);
        await Promise.all(
          images.map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise((resolve) => {
              img.onload = img.onerror = resolve;
              setTimeout(resolve, 10000); // Timeout per image
            });
          })
        );
      });
    // Helper function to capture and attach screenshot
    const captureStep = async (stepName: string) => {
      stepCounter++;
      const screenshot = await page.screenshot({ fullPage: true });
      await testInfo.attach(`Step ${stepCounter}: ${stepName}`, {
        body: screenshot,
        contentType: 'image/png',
      });
    };

    // Override goto to automatically wait for content and capture screenshot
      // Wait for any lazy-loaded content
    (page as any).goto = async (url: string, options?: any) => {
    };
      await (page as ExtendedPage).waitForAllContent();
      await captureStep(`Navigated to ${url}`);
    // Helper function to capture and attach screenshot
    const captureStep = async (stepName: string) => {
      stepCounter++;
    // Override click to capture screenshot after action
    const originalClick = page.click.bind(page);
    (page as any).click = async (selector: string, options?: any) => {
      await originalClick(selector, options);
      await page.waitForLoadState('domcontentloaded');
      await captureStep(`Clicked: ${selector}`);
    };

    // Override fill to capture screenshot after action
    const originalFill = page.fill.bind(page);
    (page as any).fill = async (selector: string, value: string, options?: any) => {
      await originalFill(selector, value, options);
      await captureStep(`Filled: ${selector}`);
    };

    // Override selectOption to capture screenshot after action
    const originalSelectOption = page.selectOption.bind(page);
    (page as any).selectOption = async (selector: string, values: any, options?: any) => {
      const result = await originalSelectOption(selector, values, options);
      await captureStep(`Selected option: ${selector}`);
      return result;
    };

    // Add a manual screenshot method for custom steps
    (page as any).captureStep = captureStep;

    await use(page as ExtendedPage);
      await testInfo.attach(`Step ${stepCounter}: ${stepName}`, {
        body: screenshot,
        contentType: 'image/png',
      });

    // Override goto to automatically wait for content and capture screenshot
    const originalGoto = extendedPage.goto.bind(extendedPage);
    extendedPage.goto = async (url, options) => {
      const response = await originalGoto(url, options);
      await extendedPage.waitForAllContent();
      await captureStep(`Navigated to ${url}`);
      return response;
    };

    // Override click to capture screenshot after action
    const originalClick = extendedPage.click.bind(extendedPage);
    extendedPage.click = async (selector, options) => {
      await originalClick(selector, options);
      await extendedPage.waitForLoadState('domcontentloaded');
      await captureStep(`Clicked: ${selector}`);
    };

    // Override fill to capture screenshot after action
    const originalFill = extendedPage.fill.bind(extendedPage);
    extendedPage.fill = async (selector, value, options) => {
      await originalFill(selector, value, options);
      await captureStep(`Filled: ${selector}`);
    };

    // Override selectOption to capture screenshot after action
    const originalSelectOption = extendedPage.selectOption.bind(extendedPage);
    extendedPage.selectOption = async (selector, values, options) => {
      const result = await originalSelectOption(selector, values, options);
      await captureStep(`Selected option: ${selector}`);
      return result;
    };

    // Add a manual screenshot method for custom steps
    extendedPage.captureStep = captureStep;

    await use(extendedPage);
  },
});

export { expect } from '@playwright/test';
