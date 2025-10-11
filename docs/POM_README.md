# Page Object Model (POM) Documentation

## Overview

This Playwright framework implements the Page Object Model (POM) design pattern to create maintainable and reusable test automation code.

## Architecture

```
TypescriptPlaywright/
├── pages/                      # Page Object Model classes
│   ├── BasePage.ts            # Base class with common methods
│   ├── HomePage.ts            # Homepage page object
│   ├── ContactPage.ts         # Contact form page object
│   ├── NavigationPage.ts      # Navigation page object
│   └── index.ts               # Export all page objects
├── tests/                      # Test specifications
│   ├── fixtures.ts            # Custom fixtures for page objects
│   ├── homepage.spec.ts       # Homepage tests
│   ├── navigation.spec.ts     # Navigation tests
│   └── contact-form.spec.ts   # Contact form tests
└── playwright.config.ts        # Playwright configuration
```

## Page Object Model Structure

### BasePage.ts
The base class that all page objects extend. Contains common functionality:
- `navigate(url)` - Navigate to a URL and wait for page load
- `waitForPageLoad()` - Wait for network idle state
- `scrollToElement(locator)` - Scroll element into view
- `getTitle()` - Get page title
- `getURL()` - Get current URL
- `waitForTimeout(ms)` - Wait for specified time

### HomePage.ts
Contains all locators and methods for the homepage:
- **Header Elements**: logo, navigation, contact info
- **Navigation Links**: home, technologies, training, projects, services, contact
- **Hero Section**: headings, descriptions
- **About Us Section**: headings, service categories
- **Methods**: `navigateToHome()`, `clickTechnologies()`, `clickTraining()`, etc.

### ContactPage.ts
Contains all locators and methods for the contact form:
- **Form Elements**: name, email, subject, message fields, submit button
- **Methods**: 
  - `fillContactForm(name, email, subject, message)` - Fill all form fields
  - `submitForm()` - Submit the form
  - `getNameValue()`, `getEmailValue()`, etc. - Get field values

### NavigationPage.ts
Contains all locators and methods for navigation elements:
- **Footer Links**: Application development, software testing, cloud computing, etc.
- **Methods**: `clickApplicationDevelopment()`, `clickSoftwareTesting()`, etc.

## Usage Examples

### Standard Approach (Manual Instantiation)

```typescript
import { test, expect } from '@playwright/test';
import { HomePage, ContactPage } from '../pages';

test.describe('My Tests', () => {
  let homePage: HomePage;
  let contactPage: ContactPage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    contactPage = new ContactPage(page);
    await homePage.navigateToHome();
  });

  test('should display homepage', async () => {
    await expect(homePage.logo).toBeVisible();
    await expect(homePage.heroHeading).toBeVisible();
  });

  test('should fill contact form', async () => {
    await contactPage.scrollToContactForm();
    await contactPage.fillContactForm(
      'John Doe',
      'john@example.com',
      'Test Subject',
      'Test Message'
    );
    await contactPage.submitForm();
  });
});
```

### Advanced Approach (Using Fixtures)

For cleaner code, use the custom fixtures defined in `tests/fixtures.ts`:

```typescript
import { test, expect } from './fixtures';

test.describe('My Tests', () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.navigateToHome();
  });

  test('should display homepage', async ({ homePage }) => {
    await expect(homePage.logo).toBeVisible();
    await expect(homePage.heroHeading).toBeVisible();
  });

  test('should fill contact form', async ({ contactPage }) => {
    await contactPage.scrollToContactForm();
    await contactPage.fillContactForm(
      'John Doe',
      'john@example.com',
      'Test Subject',
      'Test Message'
    );
    await contactPage.submitForm();
  });
});
```

## Benefits of POM

1. **Maintainability**: Locators are defined in one place. If UI changes, update only the page object.
2. **Reusability**: Page objects can be used across multiple tests.
3. **Readability**: Tests are more readable with descriptive method names.
4. **Separation of Concerns**: Test logic is separated from page structure.
5. **DRY Principle**: Don't Repeat Yourself - common actions are methods.

## Adding New Page Objects

1. Create a new file in the `pages/` directory:
```typescript
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class NewPage extends BasePage {
    readonly element: Locator;
    
    constructor(page: Page) {
        super(page);
        this.element = page.locator('#element-id');
    }
    
    async performAction() {
        await this.element.click();
    }
}
```

2. Export it in `pages/index.ts`:
```typescript
export { NewPage } from './NewPage';
```

3. Use it in your tests:
```typescript
import { NewPage } from '../pages';

test('test something', async ({ page }) => {
    const newPage = new NewPage(page);
    await newPage.performAction();
});
```

## Best Practices

1. **Keep page objects simple**: One page object per page or component
2. **Use descriptive names**: Method and property names should be self-explanatory
3. **Return page objects**: Methods that navigate should return the new page object
4. **Avoid assertions in page objects**: Keep assertions in test files
5. **Use TypeScript**: Leverage type safety and IntelliSense
6. **Group related elements**: Organize locators by sections (header, footer, etc.)

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npx playwright test tests/homepage.spec.ts

# Run tests with Allure report
npm run test:allure

# Run tests in a specific browser
npm run test:chromium
```

## Troubleshooting

### Element not found errors
- Check if the locator strategy is correct
- Use `page.pause()` to debug interactively
- Verify the element is visible/enabled before interaction

### Timeout errors
- Increase timeout in `playwright.config.ts`
- Add explicit waits: `await page.waitForSelector('selector')`
- Use `waitForLoadState('networkidle')` after navigation

### Stale element errors
- Re-query the element instead of storing references
- Use Playwright's auto-waiting feature

