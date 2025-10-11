# Project Structure

This document describes the organization of the Playwright automation framework.

## Directory Structure

```
TypescriptPlaywright/
├── config/                      # Configuration files
│   ├── playwright.config.ts     # Playwright test configuration
│   ├── mcp-server.js           # MCP server for Claude Desktop integration
│   └── mcp-config.json         # MCP server configuration
│
├── docs/                        # Documentation
│   ├── README.md               # Main project documentation
│   ├── BROWSER_SETUP.md        # Browser installation guide
│   ├── CHROMIUM_ONLY_CONFIG.md # Chromium-specific configuration
│   ├── CI-CD-SETUP.md          # CI/CD pipeline setup
│   ├── MCP_SERVER_README.md    # MCP server documentation
│   ├── MCP_SETUP_GUIDE.md      # MCP setup instructions
│   ├── PDF_REPORTING_SOLUTIONS.md # PDF report generation guide
│   ├── POM_README.md           # Page Object Model documentation
│   ├── POM_SETUP_SUMMARY.md    # POM setup summary
│   └── PROJECT_STRUCTURE.md    # This file
│
├── pages/                       # Page Object Models
│   ├── BasePage.ts             # Base page with common methods
│   ├── HomePage.ts             # Home page object
│   ├── ContactPage.ts          # Contact page object
│   ├── NavigationPage.ts       # Navigation component object
│   └── index.ts                # Page objects export
│
├── scripts/                     # Utility scripts
│   ├── generate-custom-report.js    # Custom HTML report generator
│   ├── generate-pdf-htmlnode.js     # PDF generation using html-pdf-node
│   ├── generate-pdf-improved.js     # Improved PDF generator
│   ├── generate-pdf-server.js       # PDF generation with server
│   ├── generate-pdf-static.js       # Static PDF generator
│   ├── generate-pdf.js             # Basic PDF generator
│   └── package-report.js           # Report packaging script
│
├── reports/                     # Generated reports
│   ├── custom-report.html      # Custom HTML reports
│   └── custom-report-*.pdf     # Generated PDF reports
│
├── tests/                       # Test files
│   ├── contact-form.spec.ts    # Contact form tests
│   ├── e2e-pom-example.spec.ts # E2E tests using POM
│   ├── e2e-user-journey.spec.ts # End-to-end user journey tests
│   ├── example.spec.ts         # Example tests
│   ├── fixtures.ts             # Test fixtures
│   ├── homepage.spec.ts        # Homepage tests
│   ├── interactive-elements.spec.ts # Interactive elements tests
│   ├── navigation.spec.ts      # Navigation tests
│   ├── performance.spec.ts     # Performance tests
│   └── responsive.spec.ts      # Responsive design tests
│
├── tests-examples/              # Example tests (ignored)
│   └── demo-todo-app.spec.ts   # Demo todo app tests
│
├── test-results/                # Test execution results
├── playwright-report/           # Playwright HTML reports
├── allure-results/              # Allure test results (generated)
├── allure-report/               # Allure HTML reports (generated)
│
├── azure-pipelines.yml          # Azure DevOps pipeline configuration
├── package.json                 # NPM dependencies and scripts
└── restart-claude.bat           # Claude Desktop restart utility
```

## Folder Descriptions

### `/config`
Contains all configuration files for the project:
- **playwright.config.ts**: Main Playwright configuration including test directory, timeouts, reporters, and browser settings
- **mcp-server.js**: MCP (Model Context Protocol) server for Claude Desktop integration
- **mcp-config.json**: Configuration for the MCP server

### `/docs`
Comprehensive documentation for the project:
- Setup guides for browsers, MCP, CI/CD
- Page Object Model documentation
- Reporting solutions and guides
- Project structure and organization

### `/pages`
Page Object Model (POM) implementation:
- Each page of the application has its own class
- BasePage contains common methods used across all pages
- Promotes code reusability and maintainability

### `/scripts`
Utility scripts for report generation and packaging:
- Multiple PDF generation approaches
- Custom HTML report generation
- Report packaging and archiving

### `/reports`
Output directory for generated reports:
- Custom HTML reports
- PDF reports with timestamps
- Keeps historical reports for comparison

### `/tests`
All test specifications organized by feature:
- Contact form validation tests
- Homepage content tests
- Navigation tests
- Interactive elements tests
- Performance tests
- Responsive design tests
- E2E user journey tests

### `/test-results`
Playwright's default output for test artifacts:
- Screenshots
- Videos
- Traces
- Generated automatically during test execution

## Key Features

### 1. Page Object Model (POM)
- Separates test logic from page structure
- Makes tests more maintainable
- Reduces code duplication

### 2. Multiple Reporters
- Playwright HTML reporter
- Allure reporter with detailed test results
- Custom HTML and PDF reports

### 3. MCP Integration
- Claude Desktop can run tests directly
- Generate reports via AI commands
- List test cases and get results

### 4. CI/CD Ready
- Azure Pipelines configuration included
- Automated browser installation
- Parallel test execution

## Running Tests

All npm scripts now reference the correct paths:

```bash
# Run tests on Chromium
npm run test

# Run tests on specific browser
npm run test:firefox
npm run test:webkit

# Generate and view Allure reports
npm run test:allure

# Generate PDF reports
npm run test:allure:pdf

# Generate custom reports
npm run test:custom

# Clean all generated reports
npm run clean
```

## Configuration Updates

After the reorganization:
- ✅ `package.json` updated with correct script paths
- ✅ `playwright.config.ts` updated with relative paths
- ✅ MCP configuration files updated
- ✅ Claude Desktop config updated to new MCP server location
- ✅ All scripts reference correct directories

## Next Steps

1. Review the documentation in the `/docs` folder
2. Explore the Page Object Models in `/pages`
3. Run tests to verify the new structure works correctly
4. Check generated reports in `/reports` folder

## Benefits of This Structure

✅ **Clear Separation**: Config, docs, scripts, and tests are in dedicated folders
✅ **Easy Navigation**: Find files quickly based on their purpose
✅ **Scalability**: Easy to add new tests, pages, or scripts
✅ **Maintainability**: Changes to one area don't affect others
✅ **Professional**: Industry-standard project organization

