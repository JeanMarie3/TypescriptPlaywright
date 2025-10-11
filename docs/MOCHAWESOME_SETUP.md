# Mochawesome Reporter Setup Guide

**Status**: ✅ Configured and Ready to Use

## What is Mochawesome?

Mochawesome is a beautiful, feature-rich HTML reporter for test results. It provides:
- 📊 Visual charts and graphs
- 🎨 Clean, modern UI
- 📈 Test statistics and summaries
- 🖼️ Screenshots and failure details
- 🔍 Detailed test execution information

## Configuration

Mochawesome has been integrated into your Playwright framework with the following setup:

### Playwright Config (`config/playwright.config.ts`)
```typescript
reporter: [
  ['html'],                    // Playwright HTML reporter
  ['allure-playwright'],       // Allure reporter
  ['json', {                   // JSON output for Mochawesome
    outputFile: '../mochawesome-report/mochawesome.json'
  }],
  ['junit', {                  // JUnit XML output
    outputFile: '../mochawesome-report/junit.xml'
  }]
]
```

### Report Generation Script
- **Location**: `scripts/generate-mochawesome-report.js`
- **Purpose**: Converts Playwright JSON output to Mochawesome HTML report
- **Output**: `reports/mochawesome/mochawesome-report.html`

## How to Use

### 1. Run Tests and Generate Mochawesome Report
```bash
npm run test:mochawesome
```
This command:
- Runs all Chromium tests
- Generates JSON output
- Creates beautiful Mochawesome HTML report

### 2. Generate Report from Existing Test Results
```bash
npm run mochawesome:generate
```
Use this if you've already run tests and just want to regenerate the report.

### 3. Generate and Open Report
```bash
npm run mochawesome:open
```
Generates the report and automatically opens it in your default browser.

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run test:mochawesome` | Run tests and generate Mochawesome report |
| `npm run mochawesome:generate` | Generate Mochawesome report from existing results |
| `npm run mochawesome:open` | Generate and open report in browser |
| `npm test` | Run tests (generates JSON for Mochawesome) |

## Report Location

After generation, your Mochawesome report will be available at:
```
reports/mochawesome/mochawesome-report.html
```

Simply open this file in any web browser to view your test results.

## Report Features

### 📊 Dashboard View
- Total tests run
- Pass/Fail/Pending counts
- Success rate percentage
- Test duration
- Visual pie charts

### 📝 Test Details
- Individual test results
- Test descriptions and steps
- Failure messages and stack traces
- Screenshots (when available)
- Test execution time

### 🎨 Visual Design
- Clean, modern interface
- Color-coded results (green/red/yellow)
- Responsive design
- Collapsible test suites
- Search and filter functionality

## Integration with Other Reports

Your framework now supports multiple reporting formats:

1. **Playwright HTML** - Built-in default report
2. **Allure** - Detailed enterprise-grade reports with history
3. **Mochawesome** - Beautiful, modern HTML reports
4. **Custom Reports** - Your custom PDF/HTML generation

All reporters work together and can be used simultaneously!

## Workflow Examples

### Daily Testing
```bash
# Run tests with all reports
npm test
npm run mochawesome:generate
npm run allure:generate
```

### Quick Check
```bash
# Run tests and view Mochawesome report
npm run test:mochawesome
npm run mochawesome:open
```

### Full Report Suite
```bash
# Generate all report types
npm run test:mochawesome    # Mochawesome
npm run test:allure         # Allure
npm run test:custom         # Custom PDF
```

## Troubleshooting

### Report Not Generated?
Make sure you've run tests first:
```bash
npm test
npm run mochawesome:generate
```

### JSON File Not Found?
The JSON file is created during test execution. Run:
```bash
npm run test:mochawesome
```

### Report Looks Empty?
Check that your tests actually ran. View the console output for any errors.

## Clean Up Reports

To remove all generated reports including Mochawesome:
```bash
npm run clean
```

This removes:
- `mochawesome-report/` - JSON and XML files
- `reports/mochawesome/` - HTML reports
- All other generated reports

## Benefits

✅ **Beautiful UI** - Modern, professional-looking reports
✅ **Easy to Share** - Single HTML file, no server needed
✅ **Detailed Insights** - Complete test execution information
✅ **Multiple Formats** - Works alongside Allure and custom reports
✅ **CI/CD Ready** - Generate reports in your pipeline

## Next Steps

1. Run your first test with Mochawesome: `npm run test:mochawesome`
2. Open the generated report in your browser
3. Share the HTML file with your team
4. Integrate into your CI/CD pipeline

---

**Need Help?** Check the [Mochawesome documentation](https://github.com/adamgruber/mochawesome) for advanced configuration options.

