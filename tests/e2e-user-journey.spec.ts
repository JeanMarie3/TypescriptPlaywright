import { test, expect } from '@playwright/test';

test.describe('S004: E2E User Journey Test Suite', () => {

  test.describe('Complete User Flows', () => {
    test('TC0017: Complete user journey: Browse → Learn → Contact', async ({ page }) => {
      // Step 1: Arrive at homepage
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

      // Verify user sees the main value proposition
      await expect(page.getByRole('heading', { name: 'Building better' })).toBeVisible();
      await expect(page.getByRole('heading', { name: /IT Solutions/ })).toBeVisible();

      // Step 2: Learn about services
      await page.getByRole('heading', { name: 'Our services' }).scrollIntoViewIfNeeded();
      await expect(page.getByRole('heading', { name: 'Application Development Services' })).toBeVisible();

      // Click on a service "Get Detail" button
      const getDetailButton = page.getByRole('link', { name: 'Get Detail' }).first();
      await getDetailButton.click();

      // Should scroll to contact section
      await expect(page.getByRole('form', { name: 'Contact form' })).toBeInViewport();

      // Step 3: Read about the company
      await page.getByRole('heading', { name: 'About Us' }).scrollIntoViewIfNeeded();
      await expect(page.getByText('Educatifu is a leading IT outsourcing company')).toBeVisible();

      // Step 4: Check FAQ
      await page.getByRole('heading', { name: 'FAQ' }).scrollIntoViewIfNeeded();

      // Expand a FAQ
      const faqButton = page.getByRole('button', { name: 'What are the services provided by your IT company?' });
      await faqButton.click();

      // Step 5: Contact the company
      await page.getByRole('heading', { name: 'Contact Us' }).last().scrollIntoViewIfNeeded();

      const form = page.getByRole('form', { name: 'Contact form' });
      await expect(form).toBeVisible();

      // Fill contact form
      await page.getByRole('textbox', { name: 'Your name' }).fill('John Smith');
      await page.getByRole('textbox', { name: 'Your email' }).fill('john.smith@example.com');
      await page.getByRole('textbox', { name: 'Subject' }).fill('Interested in Software Development Services');
      await page.getByRole('textbox', { name: 'Your message (optional)' }).fill('I would like to know more about your software development capabilities and pricing.');

      // Verify form is filled correctly
      await expect(page.getByRole('textbox', { name: 'Your name' })).toHaveValue('John Smith');
      await expect(page.getByRole('textbox', { name: 'Your email' })).toHaveValue('john.smith@example.com');

      // Submit form (Note: In a real test, you might want to mock this)
      await page.getByRole('button', { name: 'Submit' }).click();
      await page.waitForLoadState('networkidle');
    });
  });

  test.describe('Service Discovery Flows', () => {
    test('TC0018: Service exploration journey', async ({ page }) => {
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

      // Explore different services
      const services = [
        'Application Development Services',
        'Software Testing Services',
        'Infrastructure Services',
        'Business Process Services',
        'Cloud Computing',
        'Cyber Security'
      ];

      for (const service of services) {
        // Scroll to services section
        await page.getByRole('heading', { name: 'Our services' }).scrollIntoViewIfNeeded();

        // Find and verify service heading
        const serviceHeading = page.getByRole('heading', { name: service });
        await expect(serviceHeading).toBeVisible();

        // Each service should have description and Get Detail button
        const serviceSection = page.locator('div').filter({ hasText: service }).first();
        await expect(serviceSection).toBeVisible();
      }
    });

    test('TC0019: Technology exploration journey', async ({ page }) => {
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

      // Navigate to Technologies page
      await page.getByRole('link', { name: 'Technologies' }).click();
      await page.waitForLoadState('networkidle');

      // Should be on technologies page
      await expect(page).toHaveURL(/.*technologies/);

      // Go back to homepage via logo
      await page.getByRole('link', { name: 'Logo' }).first().click();
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveURL('https://dev.educatifu.com/');
    });
  });

  test.describe('Information Gathering Flows', () => {
    test('TC0020: Training information journey', async ({ page }) => {
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

      // Navigate to Training page
      await page.getByRole('link', { name: 'Training' }).click();
      await page.waitForLoadState('networkidle');

      // Should be on training page
      await expect(page).toHaveURL(/.*training/);

      // Navigate back via browser back button
      await page.goBack();
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveURL('https://dev.educatifu.com/');
    });

    test('TC0021: Newsletter subscription journey', async ({ page }) => {
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

      // Scroll to newsletter section
      await page.getByRole('heading', { name: 'Stay in Touch' }).scrollIntoViewIfNeeded();

      // Subscribe to newsletter
      const emailInput = page.getByRole('textbox', { name: 'Email' });
      await emailInput.fill('newsletter@example.com');

      const subscribeButton = page.getByRole('button', { name: 'subscribe' });
      await subscribeButton.click();

      await page.waitForLoadState('networkidle');

      // Also test footer newsletter
      await page.locator('contentinfo').scrollIntoViewIfNeeded();

      const footerEmailInput = page.getByRole('textbox', { name: 'Enter your e-mail' });
      await footerEmailInput.fill('footer-newsletter@example.com');

      const footerSubscribeButton = page.locator('contentinfo button').filter({ hasText: '' });
      await footerSubscribeButton.click();

      await page.waitForLoadState('networkidle');
    });

    test('TC0022: Mobile user journey', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'Mobile-specific test');

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

      // Mobile user should see essential content
      await expect(page.getByRole('heading', { name: 'Building better' })).toBeVisible();

      // Try to access navigation
      const navigation = page.getByRole('navigation').first();
      await expect(navigation).toBeVisible();

      // Scroll through content
      await page.getByRole('heading', { name: 'About Us' }).scrollIntoViewIfNeeded();
      await expect(page.getByRole('heading', { name: 'About Us' })).toBeVisible();

      // Access contact form
      await page.getByRole('heading', { name: 'Contact Us' }).last().scrollIntoViewIfNeeded();

      const form = page.getByRole('form', { name: 'Contact form' });
      await expect(form).toBeVisible();

      // Form should be usable on mobile
      await page.getByRole('textbox', { name: 'Your name' }).fill('Mobile User');
      await page.getByRole('textbox', { name: 'Your email' }).fill('mobile@example.com');

      await expect(page.getByRole('textbox', { name: 'Your name' })).toHaveValue('Mobile User');
    });

    test('TC0023: Search functionality journey', async ({ page }) => {
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

      const searchInput = page.getByRole('textbox', { name: 'Search' });
      await searchInput.click();

      // Search for different terms
      const searchTerms = [
        'software development',
        'cloud computing',
        'artificial intelligence',
        'cybersecurity'
      ];

      for (const term of searchTerms) {
        await searchInput.clear();
        await searchInput.fill(term);
        await expect(searchInput).toHaveValue(term);

        // Press enter to search
        await searchInput.press('Enter');
        await page.waitForLoadState('networkidle');

        // Wait a moment between searches
        await page.waitForTimeout(1000);
      }
    });
  });

});