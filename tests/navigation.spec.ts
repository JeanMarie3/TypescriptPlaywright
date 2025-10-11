import { test, expect } from '@playwright/test';
import { HomePage, NavigationPage } from '../pages';

test.describe('Navigation and Links Tests', () => {
  let homePage: HomePage;
  let navigationPage: NavigationPage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    navigationPage = new NavigationPage(page);
    await homePage.navigateToHome();
  });

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
    await expect(page).toHaveURL(/.*contact-us/);
  });

  test('TC0015: should have working social media links', async () => {
    // LinkedIn link should be present and have correct URL
    const linkedinUrl = await homePage.getLinkedinUrl();
    await expect(linkedinUrl).toBe('https://www.linkedin.com/company/educatifu/');
  });

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