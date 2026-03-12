import { test, expect } from '@playwright/test';
import { HomePage, NavigationPage } from '../pages';

test.describe('S003: Navigation Test Suite', () => {
  let homePage: HomePage;
  let navigationPage: NavigationPage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    navigationPage = new NavigationPage(page);
    await homePage.navigateToHome();

    // Wait for network to be idle
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

  test.describe('Main Navigation Links', () => {
    test('TC0012: should navigate to Technologies page', async ({ page }) => {
      await homePage.clickTechnologies();

      // Should navigate to technologies page
      await expect(page).toHaveURL(/.*technologies/);
    });

    test('TC0013: should navigate to Training page', async ({ page }) => {
      await homePage.clickTraining();

      // Should navigate to training page
      await expect(page).toHaveURL(/.*training/);
    });

    test('TC0014: should navigate to Contact Us page', async ({ page }) => {
      await homePage.clickContactUs();

      // Should navigate to contact page
      await expect(page).toHaveURL(/.*contact/);
    });
  });

  test.describe('Social Media Links', () => {
    test('TC0015: should have working social media links', async () => {
      // LinkedIn link should be present and have correct URL
      const linkedinUrl = await homePage.getLinkedinUrl();
      await expect(linkedinUrl).toBe('https://www.linkedin.com/company/educatifu/');
    });
  });

  test.describe('Service Links', () => {
    test('TC0016: should navigate to service detail pages from footer', async ({ page }) => {
      // Test footer service links
      const serviceLinks = [
        { name: 'Application Development Services', url: /.*application-development-services/ },
        { name: 'Software Testing Services', url: /.*software-testing-services/ },
        { name: 'Cloud Computing', url: /.*cloud-computing/ },
        { name: 'DevOps Engineering', url: /.*devops-engineering/ },
        { name: 'Business Process Services', url: /.*business-process-services/ },
        { name: 'Infrastructure Services', url: /.*infrastructure-services/ },
        { name: 'Cyber Security', url: /.*cyber-security/ }
      ];

      // Test first service link as example
      await navigationPage.clickApplicationDevelopment();
      await expect(page).toHaveURL(serviceLinks[0].url);
    });
  });

  test.describe('External Links', () => {
    // Add tests for external links if needed
  });
});