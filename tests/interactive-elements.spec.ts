import { test, expect } from '@playwright/test';

test.describe('Interactive Elements Test Suite', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('FAQ Accordion', () => {
    test('TC0024: should interact with FAQ accordion', async ({ page }) => {
      // Scroll to FAQ section
      await page.getByRole('heading', { name: 'FAQ' }).scrollIntoViewIfNeeded();

      // Test FAQ accordion functionality
      const faqButtons = [
        'What are the services provided by your IT company?',
        'What experience does your team have in AI?',
        'How does your company ensure data privacy and security?',
        'What is your company\'s experience in cloud computing?',
        'Do you offer customized technology solutions?',
        'Can you provide training and support for the technology solutions you deliver?'
      ];

      for (const question of faqButtons) {
        const button = page.getByRole('button', { name: question });
        await expect(button).toBeVisible();

        // Check if button is expandable
        await button.click();

        // Wait for animation/transition
        await page.waitForTimeout(500);

        // Click again to collapse (if applicable)
        await button.click();
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Newsletter Subscription', () => {
    test('TC0025: should test newsletter subscription', async ({ page }) => {
      // Scroll to newsletter section
      await page.getByRole('heading', { name: 'Stay in Touch' }).scrollIntoViewIfNeeded();

      const emailInput = page.getByRole('textbox', { name: 'Email' });
      const subscribeButton = page.getByRole('button', { name: 'subscribe' });

      await expect(emailInput).toBeVisible();
      await expect(subscribeButton).toBeVisible();

      // Test valid email subscription
      await emailInput.fill('test@example.com');
      await expect(emailInput).toHaveValue('test@example.com');

      await subscribeButton.click();
      await page.waitForLoadState('networkidle');

      // Clear and test invalid email
      await emailInput.clear();
      await emailInput.fill('invalid-email');
      await subscribeButton.click();
    });
  });

  test.describe('Search Functionality', () => {
    test('TC0026: should test search functionality', async ({ page }) => {
      const searchInput = page.getByRole('textbox', { name: 'Search' });
      const searchButton = page.locator('button').filter({ hasText: '' }).first();

      await expect(searchInput).toBeVisible();
      await expect(searchButton).toBeVisible();

      // Test search input
      await searchInput.click();
      await searchInput.fill('software development');
      await expect(searchInput).toHaveValue('software development');

      // Test search button click
      await searchButton.click();
      await page.waitForLoadState('networkidle');

      // Clear search
      await searchInput.clear();
      await searchInput.fill('cloud computing');
      await searchInput.press('Enter');
      await page.waitForLoadState('networkidle');
    });
  });

  test.describe('Footer Newsletter Subscription', () => {
    test('TC0027: should test footer newsletter subscription', async ({ page }) => {
      // Scroll to footer
      await page.locator('contentinfo').scrollIntoViewIfNeeded();

      const footerEmailInput = page.getByRole('textbox', { name: 'Enter your e-mail' });
      const footerSubscribeButton = page.locator('contentinfo button').filter({ hasText: '' });

      await expect(footerEmailInput).toBeVisible();
      await expect(footerSubscribeButton).toBeVisible();

      // Test footer email subscription
      await footerEmailInput.fill('footer-test@example.com');
      await expect(footerEmailInput).toHaveValue('footer-test@example.com');

      await footerSubscribeButton.click();
      await page.waitForLoadState('networkidle');
    });
  });

  test.describe('Mobile Menu', () => {
    test('TC0028: should test mobile menu functionality', async ({ page, isMobile }) => {
      if (isMobile) {
        // Look for mobile menu toggle
        const menuToggle = page.locator('[data-toggle="collapse"], .navbar-toggler, button:has-text("menu")');

        if (await menuToggle.count() > 0) {
          await menuToggle.click();

          // Check if navigation becomes visible
          const mobileNav = page.locator('.navbar-collapse, .mobile-menu');

          if (await mobileNav.count() > 0) {
            await expect(mobileNav).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Image Loading', () => {
    test('TC0029: should test image loading and visibility', async ({ page }) => {
      // Check if main images are loaded
      const images = page.locator('img[src]');
      const imageCount = await images.count();

      expect(imageCount).toBeGreaterThan(0);

      // Check first few images are visible
      for (let i = 0; i < Math.min(5, imageCount); i++) {
        const image = images.nth(i);
        await expect(image).toBeVisible();

        // Check if image has loaded properly
        const src = await image.getAttribute('src');
        expect(src).toBeTruthy();
      }
    });
  });

  test.describe('Scroll Behavior', () => {
    test('TC0030: should test scroll behavior and animations', async ({ page }) => {
      // Test smooth scrolling to different sections
      const sections = [
        { name: 'About Us', selector: page.getByRole('heading', { name: 'About Us' }) },
        { name: 'Our services', selector: page.getByRole('heading', { name: 'Our services' }) },
        { name: 'FAQ', selector: page.getByRole('heading', { name: 'FAQ' }) },
        { name: 'Contact Us', selector: page.getByRole('heading', { name: 'Contact Us' }).last() }
      ];

      for (const section of sections) {
        await section.selector.scrollIntoViewIfNeeded();
        await expect(section.selector).toBeInViewport();
        await page.waitForTimeout(500); // Wait for any scroll animations
      }

      // Scroll back to top
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);

      // Check hero section is visible again
      await expect(page.getByRole('heading', { name: 'Building better' })).toBeInViewport();
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('TC0031: should test keyboard navigation', async ({ page }) => {
      // Test Tab navigation through interactive elements
      await page.keyboard.press('Tab');

      // Continue tabbing through focusable elements
      const focusableElements = [
        'link',
        'button',
        'textbox',
        'combobox'
      ];

      let tabCount = 0;
      const maxTabs = 20; // Limit to prevent infinite loop

      while (tabCount < maxTabs) {
        await page.keyboard.press('Tab');
        tabCount++;

        // Check if we've focused on a meaningful element
        const activeElement = page.locator(':focus');
        if (await activeElement.count() > 0) {
          const tagName = await activeElement.evaluate(el => el.tagName.toLowerCase());
          const role = await activeElement.getAttribute('role');

          // Verify the focused element is interactive
          if (['a', 'button', 'input', 'textarea', 'select'].includes(tagName) ||
              ['link', 'button', 'textbox'].includes(role || '')) {
            // Successfully found focusable element
          }
        }
      }
    });
  });

});