import { test, expect } from '@playwright/test';

test.describe('S007: Responsive Design Test Suite', () => {

  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 }
  ];

  viewports.forEach(({ name, width, height }) => {
    test.describe(`${name} Viewport (${width}x${height})`, () => {
      
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Wait for all images to load
        await page.evaluate(async () => {
          const images = Array.from(document.images);
          await Promise.all(
            images.map(img => {
              if (img.complete) return Promise.resolve();
              return new Promise((resolve) => {
                img.onload = img.onerror = resolve;
                setTimeout(resolve, 15000); // Increased from 10000 to 15000
              });
            })
          );
        });

        // Additional wait for lazy-loaded content
        await page.waitForTimeout(10000); // Increased from 5000 to 10000

        // Scroll down and up to trigger any lazy loading
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });
        await page.waitForTimeout(3000);
        await page.evaluate(() => {
          window.scrollTo(0, 0);
        });
        await page.waitForTimeout(3000);
      });

      test.describe('Layout and Display', () => {
        test(`TC0038: should display correctly on ${name}`, async ({ page }) => {
          // Check main elements are visible
          await expect(page.getByRole('heading', { name: 'Building better' })).toBeVisible();
          await expect(page.getByRole('navigation').first()).toBeVisible();

          // Check contact information is accessible
          if (name !== 'Mobile') {
            // On desktop and tablet, contact info should be in header
            await expect(page.getByText('Warsaw, Poland')).toBeVisible();
          }

          // Footer should always be present
          await expect(page.locator('contentinfo')).toBeVisible();
        });

        test(`TC0040: should have readable text on ${name}`, async ({ page }) => {
          // Check text elements are properly sized and readable
          const headings = page.getByRole('heading');
          const headingCount = await headings.count();

          // Verify at least some headings are visible
          expect(headingCount).toBeGreaterThan(0);

          for (let i = 0; i < Math.min(5, headingCount); i++) {
            const heading = headings.nth(i);
            if (await heading.isVisible()) {
              // Check heading has text content
              const text = await heading.textContent();
              expect(text?.trim()).toBeTruthy();
            }
          }
        });
      });

      test.describe('Navigation', () => {
        test(`TC0039: should have working navigation on ${name}`, async ({ page }) => {
          const navigation = page.getByRole('navigation').first();
          await expect(navigation).toBeVisible();

          // Main navigation links should be accessible
          if (name === 'Desktop') {
            // Desktop should show all nav links directly
            await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
            await expect(page.getByRole('link', { name: 'Technologies' })).toBeVisible();
            await expect(page.getByRole('link', { name: 'Training' })).toBeVisible();
          }

          // Logo should always be visible
          await expect(page.getByRole('img', { name: 'Logo' }).first()).toBeVisible();
        });
      });

      test.describe('Form Usability', () => {
        test(`TC0041: should have accessible contact form on ${name}`, async ({ page }) => {
          // Scroll to contact form
          await page.getByRole('heading', { name: 'Contact Us' }).scrollIntoViewIfNeeded();

          const form = page.getByRole('form', { name: 'Contact form' });
          await expect(form).toBeVisible();

          // Form fields should be properly sized and accessible
          const formFields = [
            page.getByRole('textbox', { name: 'Your name' }),
            page.getByRole('textbox', { name: 'Your email' }),
            page.getByRole('textbox', { name: 'Subject' }),
            page.getByRole('textbox', { name: 'Your message (optional)' })
          ];

          for (const field of formFields) {
            await expect(field).toBeVisible();

            // Test field is clickable/focusable
            await field.click();
            await expect(field).toBeFocused();
          }

          // Submit button should be accessible
          await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
        });
      });

      test.describe('Scrolling and Image Display', () => {
        test(`TC0042: should handle scrolling properly on ${name}`, async ({ page }) => {
          // Test scrolling through different sections
          const sections = [
            page.getByRole('heading', { name: 'About Us' }),
            page.getByRole('heading', { name: 'Our services' }),
            page.getByRole('heading', { name: 'FAQ' })
          ];

          for (const section of sections) {
            await section.scrollIntoViewIfNeeded();
            await expect(section).toBeInViewport();

            // Wait for any scroll animations
            await page.waitForTimeout(300);
          }

          // Scroll back to top
          await page.evaluate(() => window.scrollTo(0, 0));
          await page.waitForTimeout(300);

          // Hero section should be visible again
          const heroHeading = page.getByRole('heading', { name: 'Building better' });
          await expect(heroHeading).toBeInViewport();
        });

        test(`should have properly sized images on ${name}`, async ({ page }) => {
          const images = page.locator('img[src]');
          const imageCount = await images.count();

          if (imageCount > 0) {
            // Check first few images
            for (let i = 0; i < Math.min(3, imageCount); i++) {
              const image = images.nth(i);

              if (await image.isVisible()) {
                // Image should have reasonable dimensions
                const boundingBox = await image.boundingBox();
                if (boundingBox) {
                  expect(boundingBox.width).toBeGreaterThan(0);
                  expect(boundingBox.height).toBeGreaterThan(0);

                  // Images shouldn't overflow viewport on mobile
                  if (name === 'Mobile') {
                    expect(boundingBox.width).toBeLessThanOrEqual(width + 50); // Allow some tolerance
                  }
                }
              }
            }
          }
        });
      });

    });
  });

  test('should handle orientation changes on mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Orientation test only for mobile');
    
    // Portrait mode
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await expect(page.getByRole('heading', { name: 'Building better' })).toBeVisible();
    
    // Landscape mode
    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForTimeout(500);
    
    await expect(page.getByRole('heading', { name: 'Building better' })).toBeVisible();
    await expect(page.getByRole('navigation').first()).toBeVisible();
  });

});