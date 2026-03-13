const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('🚀 Generating PDF from Allure Report...');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 }
  });

  // Navigate to the Allure report index.html
  const reportPath = path.join(__dirname, 'allure-report', 'index.html');
  console.log(`📄 Loading report from: ${reportPath}`);

  await page.goto(`file://${reportPath}`, {
    waitUntil: 'networkidle',
    timeout: 60000
  });

  // Wait for the main content to load
  console.log('⏳ Waiting for report content to load...');
  await page.waitForSelector('.app', { timeout: 15000 });

  // Wait for all data to be loaded - check for loading spinners to disappear
  console.log('⏳ Waiting for data to load completely...');
  await page.waitForFunction(() => {
    const loadingElements = document.querySelectorAll('.loading, .spinner, [class*="loading"]');
    return loadingElements.length === 0 || Array.from(loadingElements).every(el => el.style.display === 'none');
  }, { timeout: 20000 }).catch(() => console.log('Note: Some loading elements may still be present'));

  // Wait for charts and widgets to render
  console.log('📊 Waiting for charts and widgets to render...');
  await page.waitForTimeout(8000);

  // Wait for specific Allure elements to be visible
  await page.waitForSelector('.widget__title', { timeout: 10000 }).catch(() => {});
  await page.waitForSelector('[data-testid], .chart, .statistic', { timeout: 5000 }).catch(() => {});

  // Scroll through the page to trigger lazy-loaded content
  console.log('📜 Triggering lazy-loaded content...');
  await page.evaluate(async () => {
    const scrollHeight = document.documentElement.scrollHeight;
    const viewportHeight = window.innerHeight;
    const scrollSteps = Math.ceil(scrollHeight / viewportHeight);

    for (let i = 0; i < scrollSteps; i++) {
      window.scrollTo(0, i * viewportHeight);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Scroll back to top
    window.scrollTo(0, 0);
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  // Click on Overview to show full dashboard
  console.log('📊 Expanding report sections...');
  try {
    const overviewTab = await page.locator('a[href="#"]').first();
    if (await overviewTab.isVisible()) {
      await overviewTab.click();
      await page.waitForTimeout(3000);
    }
  } catch (e) {
    console.log('Note: Could not click overview tab');
  }

  // Final wait to ensure everything is rendered
  console.log('⏳ Final rendering wait...');
  await page.waitForTimeout(5000);

  // Generate PDF with timestamp to avoid file lock issues
  console.log('📝 Generating PDF...');
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const pdfPath = path.join(__dirname, 'allure-report', `allure-report-${timestamp}.pdf`);

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: false,
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size: 10px; width: 100%; text-align: center; color: #666; padding: 5px;">Allure Test Report - Generated on ' + new Date().toLocaleString() + '</div>',
    footerTemplate: '<div style="font-size: 10px; width: 100%; text-align: center; color: #666; padding: 5px;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
    margin: {
      top: '50px',
      right: '20px',
      bottom: '50px',
      left: '20px'
    },
    scale: 0.75
  });

  console.log(`✅ PDF report generated successfully!`);
  console.log(`📁 Location: ${pdfPath}`);
  console.log(`\n💡 Tip: The PDF includes all loaded charts and test data.`);

  await browser.close();
})();
