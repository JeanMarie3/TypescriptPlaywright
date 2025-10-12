# Test Suite Organization

## Overview

Your Playwright tests have been reorganized into logical test suites with nested describe blocks for better organization, readability, and reporting.

## Test Suite Structure

### 📁 Test Files and Their Suites

---

## 1. **Homepage Test Suite** (`homepage.spec.ts`)

**Main Suite:** `Homepage Test Suite`

### Sub-Suites:
- **Page Load and Basic Elements**
  - TC0003: Page title verification
  - TC0005: Company logo display

- **Navigation Menu**
  - TC0004: Main navigation menu display

- **Hero Section**
  - TC0006: Hero section with main heading

- **Header Contact Information**
  - TC0007: Contact information display

- **About Us Section**
  - TC0008: About Us section visibility

---

## 2. **Navigation Test Suite** (`navigation.spec.ts`)

**Main Suite:** `Navigation Test Suite`

### Sub-Suites:
- **Main Navigation Links**
  - TC0012: Navigate to Technologies page
  - TC0013: Navigate to Training page
  - TC0014: Navigate to Contact Us page

- **Social Media Links**
  - TC0015: Social media links functionality

- **Service Links**
  - TC0016: Service detail page navigation

- **External Links**
  - Tests for external link handling

---

## 3. **Contact Form Test Suite** (`contact-form.spec.ts`)

**Main Suite:** `Contact Form Test Suite`

### Sub-Suites:
- **Form Display and Elements**
  - TC0009: Display all required fields

- **Form Functionality**
  - TC0010: Fill and submit form
  - TC0011: Email format validation

- **Form Validation**
  - Field validation tests

- **Contact Information Display**
  - Contact info visibility tests

---

## 4. **Performance Test Suite** (`performance.spec.ts`)

**Main Suite:** `Performance Test Suite`

### Sub-Suites:
- **Page Load Performance**
  - TC0032: Load time testing
  - Console error detection

- **Accessibility - Semantic HTML**
  - TC0033: Heading hierarchy
  - TC0034: Link accessibility
  - TC0035: Form accessibility

- **Accessibility - Visual**
  - TC0036: Color contrast testing

- **Accessibility - Keyboard Navigation**
  - TC0037: Focus management

- **Progressive Enhancement**
  - JavaScript disabled testing

---

## 5. **Interactive Elements Test Suite** (`interactive-elements.spec.ts`)

**Main Suite:** `Interactive Elements Test Suite`

### Sub-Suites:
- **FAQ Accordion**
  - TC0024: Accordion interaction

- **Newsletter Subscription**
  - TC0025: Newsletter form testing

- **Search Functionality**
  - TC0026: Search input and button

- **Footer Newsletter Subscription**
  - TC0027: Footer newsletter form

- **Mobile Menu**
  - TC0028: Mobile menu functionality

- **Image Loading**
  - TC0029: Image visibility and loading

- **Scroll Behavior**
  - TC0030: Scroll and animations

- **Keyboard Navigation**
  - TC0031: Tab navigation testing

---

## 6. **Responsive Design Test Suite** (`responsive.spec.ts`)

**Main Suite:** `Responsive Design Test Suite`

### Sub-Suites (Per Viewport):

Each viewport (Mobile 375x667, Tablet 768x1024, Desktop 1920x1080) contains:

- **Layout and Display**
  - TC0038: Display correctness per viewport
  - TC0040: Text readability

- **Navigation**
  - TC0039: Navigation functionality

- **Form Usability**
  - TC0041: Contact form accessibility

- **Scrolling and Image Display**
  - TC0042: Scrolling behavior
  - Image sizing tests

**Additional Test:**
- Orientation change handling (mobile only)

---

## 7. **E2E User Journey Test Suite** (`e2e-user-journey.spec.ts`)

**Main Suite:** `E2E User Journey Test Suite`

### Sub-Suites:
- **Complete User Flows**
  - TC0017: Browse → Learn → Contact journey

- **Service Discovery Flows**
  - TC0018: Service exploration
  - TC0019: Technology exploration

- **Information Gathering Flows**
  - TC0020: Training information journey
  - TC0021: Newsletter subscription journey
  - TC0022: Mobile user journey
  - TC0023: Search functionality journey

---

## Benefits of This Organization

### 1. **Better Reporting** 📊
Reports now show clear hierarchy:
```
Homepage Test Suite
  └── Page Load and Basic Elements
      ├── TC0003: should have correct title
      └── TC0005: should display company logo
  └── Navigation Menu
      └── TC0004: should display main navigation menu
```

### 2. **Improved Readability** 📖
- Tests are grouped by functionality
- Easy to find specific test types
- Logical structure reflects user workflows

### 3. **Easier Maintenance** 🔧
- Related tests grouped together
- Clear separation of concerns
- Easy to add new tests to appropriate suite

### 4. **Better Test Execution** ⚡
- Can run specific suites using grep
- Parallel execution per suite
- Clearer test failure patterns

### 5. **Enhanced Documentation** 📝
- Self-documenting test structure
- Clear test intent
- Easy onboarding for new team members

---

## Running Specific Test Suites

### Run Entire Suite:
```bash
npm test
```

### Run Specific File:
```bash
npx playwright test homepage.spec.ts
```

### Run Specific Suite (using grep):
```bash
# Run only navigation tests
npx playwright test --grep "Navigation Test Suite"

# Run only performance tests
npx playwright test --grep "Performance Test Suite"

# Run only responsive tests for mobile
npx playwright test --grep "Mobile Viewport"

# Run only accessibility tests
npx playwright test --grep "Accessibility"

# Run only E2E tests
npx playwright test --grep "E2E User Journey"
```

### Run Tests by Test Case Number:
```bash
# Run specific test case
npx playwright test --grep "TC0003"

# Run multiple test cases
npx playwright test --grep "TC0003|TC0004|TC0005"
```

### Run Tests Excluding Specific Suites:
```bash
# Exclude E2E tests
npx playwright test --grep-invert "E2E User Journey"

# Exclude performance tests
npx playwright test --grep-invert "Performance Test Suite"
```

---

## Test Execution Strategy

### For Development:
```bash
# Quick smoke tests
npx playwright test --grep "Page Load and Basic Elements|Navigation Menu"

# Form testing
npx playwright test --grep "Contact Form Test Suite"
```

### For CI/CD:
```bash
# Full suite
npm test

# Critical path only
npx playwright test --grep "Homepage Test Suite|Contact Form Test Suite|E2E User Journey"
```

### For Regression:
```bash
# All functional tests
npx playwright test --grep-invert "Performance|Responsive"

# Performance only
npx playwright test --grep "Performance Test Suite"
```

---

## Suite Execution Order

When running all tests, suites execute in this order:

1. **Homepage Tests** - Foundation tests
2. **Navigation Tests** - Link and routing tests
3. **Contact Form Tests** - Form functionality
4. **Interactive Elements Tests** - UI component tests
5. **Performance Tests** - Load time and accessibility
6. **Responsive Tests** - Cross-device testing
7. **E2E User Journey Tests** - Complete workflows

---

## Test Coverage by Suite

| Suite | Tests | TC Numbers | Focus Area |
|-------|-------|------------|------------|
| Homepage | 6+ | TC0003-TC0008 | Basic page elements |
| Navigation | 5+ | TC0012-TC0016 | Link navigation |
| Contact Form | 4+ | TC0009-TC0011 | Form functionality |
| Interactive | 8+ | TC0024-TC0031 | UI interactions |
| Performance | 6+ | TC0032-TC0037 | Speed & accessibility |
| Responsive | 12+ | TC0038-TC0042 | Device compatibility |
| E2E | 6+ | TC0017-TC0023 | User workflows |

**Total Test Cases: 56+**

---

## Best Practices Applied

### ✅ Logical Grouping
Tests grouped by feature, not by file size

### ✅ Nested Describe Blocks
Clear hierarchy for better organization

### ✅ Consistent Naming
- Main Suite: `[Feature] Test Suite`
- Sub-Suite: `[Category/Feature Name]`
- Test: `TC####: [Description]`

### ✅ Shared Setup
`beforeEach` blocks at appropriate levels

### ✅ Clear Intent
Suite names describe what's being tested

### ✅ Scalability
Easy to add new tests without restructuring

---

## Reports With New Structure

### Allure Report:
Shows nested suites with full hierarchy:
```
📊 Homepage Test Suite
   📁 Page Load and Basic Elements
      ✅ TC0003: should have correct title
      ✅ TC0005: should display company logo
   📁 Navigation Menu
      ✅ TC0004: should display main navigation menu
```

### Monocart Report:
Displays suites in beautiful cards with statistics per suite

### Playwright HTML Report:
Shows expandable test suites with filtering options

---

## Next Steps

1. ✅ **Run your tests** to see the new structure in reports
2. ✅ **Review reports** to verify suite organization
3. ✅ **Add new tests** to appropriate suites
4. ✅ **Use grep patterns** to run specific test groups
5. ✅ **Document** suite-specific requirements

---

## Quick Reference

### Test File → Main Suite Mapping:
- `homepage.spec.ts` → Homepage Test Suite
- `navigation.spec.ts` → Navigation Test Suite
- `contact-form.spec.ts` → Contact Form Test Suite
- `interactive-elements.spec.ts` → Interactive Elements Test Suite
- `performance.spec.ts` → Performance Test Suite
- `responsive.spec.ts` → Responsive Design Test Suite
- `e2e-user-journey.spec.ts` → E2E User Journey Test Suite

---

**Your test framework is now professionally organized with clear, maintainable test suites!** 🎉

