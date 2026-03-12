# Educatifu Website Automation Suite

This is a comprehensive Playwright automation suite for testing the Educatifu Technologies website at `dev.educatifu.com`.

## Test Coverage

The automation suite includes the following test categories:

### 1. Homepage Tests (`homepage.spec.ts`)
- ✅ Page title verification
- ✅ Navigation menu display and functionality  
- ✅ Company logo visibility
- ✅ Hero section content
- ✅ Contact information display
- ✅ About Us section
- ✅ Services section
- ✅ FAQ section
- ✅ Footer information
- ✅ Search functionality
- ✅ Statistics display
- ✅ Newsletter subscription

### 2. Navigation Tests (`navigation.spec.ts`)
- ✅ Navigation to Technologies page
- ✅ Navigation to Training page
- ✅ Navigation to Contact Us page
- ✅ Social media links verification
- ✅ Service detail page navigation
- ✅ Company page navigation
- ✅ External link handling
- ✅ Logo link functionality
- ✅ Service "Get Detail" buttons

### 3. Contact Form Tests (`contact-form.spec.ts`)
- ✅ Form field display and validation
- ✅ Form filling and submission
- ✅ Email format validation
- ✅ Form field clearing
- ✅ Contact information display
- ✅ Form accessibility testing

### 4. Interactive Elements Tests (`interactive-elements.spec.ts`)
- ✅ FAQ accordion functionality
- ✅ Newsletter subscription testing
- ✅ Search functionality
- ✅ Footer newsletter subscription
- ✅ Mobile menu functionality
- ✅ Image loading verification
- ✅ Scroll behavior testing
- ✅ Keyboard navigation

### 5. Responsive Design Tests (`responsive.spec.ts`)
- ✅ Mobile viewport (375x667) testing
- ✅ Tablet viewport (768x1024) testing
- ✅ Desktop viewport (1920x1080) testing
- ✅ Navigation responsiveness
- ✅ Text readability across devices
- ✅ Contact form accessibility
- ✅ Scroll behavior
- ✅ Image sizing
- ✅ Orientation change handling

### 6. Performance & Accessibility Tests (`performance.spec.ts`)
- ✅ Page load time verification
- ✅ Heading hierarchy validation
- ✅ Link accessibility testing
- ✅ Form accessibility validation
- ✅ Image alt text verification
- ✅ Color contrast checking
- ✅ Focus management
- ✅ Console error monitoring
- ✅ JavaScript-disabled graceful handling

### 7. E2E User Journey Tests (`e2e-user-journey.spec.ts`)
- ✅ Complete user flow: Browse → Learn → Contact
- ✅ Service exploration journey
- ✅ Technology exploration
- ✅ Training information journey
- ✅ Newsletter subscription flow
- ✅ Mobile user experience
- ✅ Search functionality journey

## Running Tests

### Prerequisites
```bash
npm install
```

### Run All Tests
```bash
npx playwright test
```

### Run Specific Test File
```bash
npx playwright test homepage.spec.ts
npx playwright test contact-form.spec.ts
npx playwright test navigation.spec.ts
```

### Run Tests in Headed Mode (Visible Browser)
```bash
npx playwright test --headed
npx playwright test homepage.spec.ts --headed
```

### Run Tests on Specific Browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Run Specific Test
```bash
npx playwright test --grep "should have correct title"
npx playwright test --grep "contact form"
```

### Run Tests with Debug Mode
```bash
npx playwright test --debug
```

### Generate Test Report
```bash
npx playwright test
npx playwright show-report
```

## Test Configuration

The tests are configured to run against `https://dev.educatifu.com` as the base URL. This is set in `playwright.config.ts`:

```typescript
use: {
  baseURL: 'https://dev.educatifu.com',
  // other configurations...
}
```

## Browser Support

Tests run on:
- ✅ Chromium (Chrome/Edge)
- ✅ Firefox  
- ✅ WebKit (Safari)

## Mobile Testing

Tests include responsive design verification across:
- Mobile (375x667)
- Tablet (768x1024)  
- Desktop (1920x1080)

## Key Features Automated

### Website Functionality
- Homepage content verification
- Navigation menu functionality
- Contact form submission
- Search functionality
- Newsletter subscription
- FAQ accordion interaction
- Social media links
- Service information display

### Quality Assurance
- Cross-browser compatibility
- Responsive design validation
- Accessibility compliance
- Performance monitoring
- Error detection
- User experience flows

### User Journeys
- Visitor browsing flow
- Service inquiry process
- Contact form completion
- Newsletter subscription
- Mobile user experience

## Reports

After running tests, view the HTML report:
```bash
npx playwright show-report
```

The report includes:
- Test results summary
- Screenshots of failures
- Video recordings (if enabled)
- Execution traces
- Performance metrics

## CI/CD Integration

These tests can be integrated into CI/CD pipelines for:
- Automated regression testing
- Pre-deployment validation
- Continuous quality monitoring
- Performance tracking

## Maintenance

- Tests are designed to be resilient to minor UI changes
- Selectors use semantic roles and accessible names when possible
- Page object patterns could be implemented for larger scale maintenance
- Regular updates may be needed as the website evolves

## Troubleshooting

### Common Issues

1. **Timeout Errors**: Increase timeout in playwright.config.ts if needed
2. **Element Not Found**: Check if website structure has changed
3. **Network Issues**: Ensure stable internet connection
4. **Browser Installation**: Run `npx playwright install` if browsers are missing

### Debug Mode
Use `--debug` flag to step through tests interactively:
```bash
npx playwright test --debug
```

## Contributing

When adding new tests:
1. Follow existing naming conventions
2. Use semantic selectors (roles, labels)
3. Include proper wait conditions
4. Add appropriate error handling
5. Test across all browsers
6. Document new test scenarios

---

**Website**: https://dev.educatifu.com  
**Framework**: Playwright with TypeScript  
**Test Count**: 216 total tests across 8 files  
**Browsers**: Chromium, Firefox, WebKit  
**Coverage**: Homepage, Navigation, Forms, Responsive, Performance, E2E
