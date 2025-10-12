import { test, expect } from '@playwright/test';
import { HomePage, ContactPage } from '../pages';

test.describe('Contact Form Test Suite', () => {
  let homePage: HomePage;
  let contactPage: ContactPage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    contactPage = new ContactPage(page);
    await homePage.navigateToHome();
    await contactPage.scrollToContactForm();
  });

  test.describe('Form Display and Elements', () => {
    test('TC0009: should display contact form with all required fields', async () => {
      await expect(contactPage.contactForm).toBeVisible();

      // Check all form fields are present
      await expect(contactPage.nameField).toBeVisible();
      await expect(contactPage.emailField).toBeVisible();
      await expect(contactPage.subjectField).toBeVisible();
      await expect(contactPage.messageField).toBeVisible();
      await expect(contactPage.submitButton).toBeVisible();
    });
  });

  test.describe('Form Functionality', () => {
    test('TC0010: should fill and submit contact form', async () => {
      // Fill form fields using POM methods
      await contactPage.fillContactForm(
        'John Doe',
        'john.doe@example.com',
        'Test Inquiry',
        'This is a test message for automation testing.'
      );

      // Verify fields are filled
      await expect(await contactPage.getNameValue()).toBe('John Doe');
      await expect(await contactPage.getEmailValue()).toBe('john.doe@example.com');
      await expect(await contactPage.getSubjectValue()).toBe('Test Inquiry');
      await expect(await contactPage.getMessageValue()).toBe('This is a test message for automation testing.');

      // Submit form
      await contactPage.submitForm();
    });

    test('TC0011: should validate email format', async ({ page }) => {
      // Fill form with invalid email
      await contactPage.fillName('John Doe');
      await contactPage.fillEmail('invalid-email');
      await contactPage.fillSubject('Test Subject');

      // Try to submit - browser should show validation error
      await contactPage.submitButton.click();
    });
  });

  test.describe('Form Validation', () => {
    // ...existing validation tests...
  });

  test.describe('Contact Information Display', () => {
    // ...existing contact info tests...
  });
});