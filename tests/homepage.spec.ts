import { test, expect } from '@playwright/test';
import { HomePage } from '../pages';

test.describe('S001: Homepage Test Suite', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.navigateToHome();
  });

  test.describe('Page Load and Basic Elements', () => {
    test('TC0003: should have correct title', async ({ page }) => {
      await expect(page).toHaveTitle('Educatifu Technologies');
    });

    test('TC0005: should display company logo', async () => {
      await expect(homePage.logo).toBeVisible();
    });
  });

  test.describe('Navigation Menu', () => {
    test('TC0004: should display main navigation menu', async () => {
      await expect(homePage.navigation).toBeVisible();

      // Check main navigation links
      await expect(homePage.homeLink).toBeVisible();
      await expect(homePage.technologiesLink).toBeVisible();
      await expect(homePage.trainingLink).toBeVisible();
      await expect(homePage.projectsLink).toBeVisible();
      await expect(homePage.servicesLink).toBeVisible();
      await expect(homePage.contactUsLink).toBeVisible();
    });
  });

  test.describe('Hero Section', () => {
    test('TC0006: should display hero section with main heading', async () => {
      await expect(homePage.heroHeading).toBeVisible();
      await expect(homePage.itSolutionsHeading).toBeVisible();
      await expect(homePage.heroDescription).toBeVisible();
    });
  });

  test.describe('Header Contact Information', () => {
    test('TC0007: should display contact information in header', async () => {
      await expect(homePage.locationText).toBeVisible();
      await expect(homePage.emailText).toBeVisible();
      await expect(homePage.phoneText).toBeVisible();
      await expect(homePage.officeHoursText).toBeVisible();
    });
  });

  test.describe('About Us Section', () => {
    test('TC0008: should display About Us section', async () => {
      await expect(homePage.aboutUsHeading).toBeVisible();
      await expect(homePage.aboutUsSubheading).toBeVisible();

      // Check for service categories
      await expect(homePage.softwareDevelopmentHeading).toBeVisible();
    });
  });

});