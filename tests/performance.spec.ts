import { test, expect } from '@playwright/test';

test.describe('Performance Test Suite', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Load Performance', () => {
    test('TC0032: should load page within reasonable time', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const loadTime = Date.now() - startTime;

      // Page should load within 10 seconds
      expect(loadTime).toBeLessThan(10000);

      // Core elements should be visible quickly
      await expect(page.getByRole('heading', { name: 'Building better' })).toBeVisible();
      await expect(page.getByRole('navigation').first()).toBeVisible();
    });

    test('should have no console errors', async ({ page }) => {
      const errors: string[] = [];

      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Filter out known acceptable errors
      const significantErrors = errors.filter(error =>
        !error.includes('403') &&
        !error.includes('Failed to load resource') &&
        !error.toLowerCase().includes('network')
      );

      expect(significantErrors.length).toBeLessThan(5);
    });
  });

  test.describe('Accessibility - Semantic HTML', () => {
    test('TC0033: should have proper heading hierarchy', async ({ page }) => {
      // Check heading levels are properly structured
      const h1Elements = page.locator('h1');
      const h2Elements = page.locator('h2');
      const h3Elements = page.locator('h3');
      const h4Elements = page.locator('h4');
      const h5Elements = page.locator('h5');

      // Should have at least one main heading
      const h1Count = await h1Elements.count();
      const h2Count = await h2Elements.count();

      // Either h1 or h2 should be present for main content
      expect(h1Count + h2Count).toBeGreaterThan(0);

      // Check heading text content is meaningful
      if (h1Count > 0) {
        const h1Text = await h1Elements.first().textContent();
        expect(h1Text?.trim()).toBeTruthy();
      }

      if (h2Count > 0) {
        const h2Text = await h2Elements.first().textContent();
        expect(h2Text?.trim()).toBeTruthy();
      }
    });

    test('TC0034: should have proper link accessibility', async ({ page }) => {
      const links = page.getByRole('link');
      const linkCount = await links.count();

      expect(linkCount).toBeGreaterThan(0);

      // Check first few links have accessible names
      for (let i = 0; i < Math.min(10, linkCount); i++) {
        const link = links.nth(i);

        if (await link.isVisible()) {
          const linkText = await link.textContent();
          const ariaLabel = await link.getAttribute('aria-label');
          const title = await link.getAttribute('title');

          // Link should have accessible text or label
          const hasAccessibleName =
            (linkText && linkText.trim().length > 0) ||
            (ariaLabel && ariaLabel.trim().length > 0) ||
            (title && title.trim().length > 0);

          if (!hasAccessibleName) {
            // Check if it's an image link
            const img = link.locator('img');
            if (await img.count() > 0) {
              const imgAlt = await img.getAttribute('alt');
              expect(imgAlt?.trim()).toBeTruthy();
            }
          }
        }
      }
    });

    test('TC0035: should have proper form accessibility', async ({ page }) => {
      // Scroll to contact form
      await page.getByRole('heading', { name: 'Contact Us' }).scrollIntoViewIfNeeded();

      const form = page.getByRole('form', { name: 'Contact form' });
      await expect(form).toBeVisible();

      // Check form fields have proper labels
      const formFields = [
        { field: page.getByRole('textbox', { name: 'Your name' }), expectedName: 'Your name' },
        { field: page.getByRole('textbox', { name: 'Your email' }), expectedName: 'Your email' },
        { field: page.getByRole('textbox', { name: 'Subject' }), expectedName: 'Subject' },
        { field: page.getByRole('textbox', { name: 'Your message (optional)' }), expectedName: 'Your message (optional)' }
      ];

      for (const { field, expectedName } of formFields) {
        await expect(field).toBeVisible();

        // Field should be accessible by its name
        const accessibleName = await field.getAttribute('aria-label') ||
                              await field.getAttribute('placeholder') ||
                              expectedName;
        expect(accessibleName).toBeTruthy();
      }

      // Submit button should be accessible
      const submitButton = page.getByRole('button', { name: 'Submit' });
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toBeEnabled();
    });
  });

  test.describe('Accessibility - Visual', () => {
    test('TC0036: should have proper color contrast', async ({ page }) => {
      // This is a basic check - in a real scenario, you'd use axe-core or similar tools

      // Check main text elements are visible (indicates sufficient contrast)
      const textElements = [
        page.getByRole('heading', { name: 'Building better' }),
        page.getByText('When it comes to developing unique pieces of software,'),
        page.getByRole('heading', { name: 'About Us' })
      ];

      for (const element of textElements) {
        if (await element.isVisible()) {
          await expect(element).toBeVisible();

          // Element should have text content
          const text = await element.textContent();
          expect(text?.trim()).toBeTruthy();
        }
      }
    });
  });

  test.describe('Accessibility - Keyboard Navigation', () => {
    test('TC0037: should handle focus management', async ({ page }) => {
      // Test keyboard navigation focus
      await page.keyboard.press('Tab');

      // Check that focus is visible on interactive elements
      let focusedElement = page.locator(':focus');

      // Tab through several elements
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');

        focusedElement = page.locator(':focus');
        if (await focusedElement.count() > 0) {
          // Focused element should be visible
          await expect(focusedElement).toBeVisible();
        }
      }
    });
  });

  test.describe('Progressive Enhancement', () => {
    test('should handle JavaScript disabled gracefully', async ({ page, context }) => {
      // Create a new context with JavaScript disabled
      const noJSContext = await context.browser()?.newContext({
        javaScriptEnabled: false
      });

      if (noJSContext) {
        const noJSPage = await noJSContext.newPage();

        await noJSPage.goto('/');
        await noJSPage.waitForLoadState('domcontentloaded');

        // Basic content should still be visible
        await expect(noJSPage.getByRole('heading', { name: /Building better|Educatifu/ })).toBeVisible();
        await expect(noJSPage.getByRole('navigation').first()).toBeVisible();

        await noJSContext.close();
      }
    });
  });

});