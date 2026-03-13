const { chromium } = require('playwright');
const path = require('path');

(async () => {
  console.log('🚀 Generating Allure PDF Report (High Quality)...');

  const browser = await chromium.launch({
    headless: false, // Run in headed mode to see what's happening
    args: ['--disable-web-security']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2 // Higher quality
  });

  const page = await context.newPage();

  // Navigate to the Allure report
  const reportPath = path.join(__dirname, 'allure-report', 'index.html');
  console.log(`📄 Loading report from: ${reportPath}`);

  await page.goto(`file://${reportPath}`, {
    waitUntil: 'networkidle',
    timeout: 120000
  });

  console.log('⏳ Waiting for Allure app to initialize...');
  await page.waitForSelector('.app', { timeout: 30000 });

  console.log('⏳ Waiting for main content...');
  // Wait for specific Allure widgets
  await page.waitForSelector('.widget', { timeout: 20000 }).catch(() => {
    console.log('Note: Widget selector not found, continuing...');
  });

  // Wait for all XHR/Fetch requests to complete
  console.log('⏳ Waiting for all data to load...');
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  // Additional wait for JavaScript rendering
  console.log('⏳ Waiting for JavaScript to render everything...');
  await page.waitForTimeout(15000);

  // Try to detect and wait for loading indicators to disappear
  await page.evaluate(() => {
    return new Promise((resolve) => {
      const checkLoading = () => {
        const loaders = document.querySelectorAll('.loading, .spinner, [class*="load"]');
        const visibleLoaders = Array.from(loaders).filter(el => {
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden';
        });

        if (visibleLoaders.length === 0) {
          resolve();
        } else {
          setTimeout(checkLoading, 1000);
        }
      };

      // Start checking, but timeout after 20 seconds
      checkLoading();
      setTimeout(resolve, 20000);
    });
  });

  console.log('📊 Scrolling through page to trigger all lazy content...');
  // Scroll slowly through the entire page
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.documentElement.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if(totalHeight >= scrollHeight){
          clearInterval(timer);
          window.scrollTo(0, 0);
          setTimeout(resolve, 2000);
        }
      }, 100);
    });
  });

  console.log('⏳ Final wait for everything to settle...');
  await page.waitForTimeout(10000);

  // Try clicking on overview if it exists
  try {
    const overviewLink = page.locator('a[href="#"]').first();
    if (await overviewLink.isVisible()) {
      await overviewLink.click();
      await page.waitForTimeout(5000);
    }
  } catch (e) {
    console.log('Note: Could not interact with navigation');
  }

  // One final wait
  await page.waitForTimeout(5000);

  // Generate PDF
  console.log('📝 Generating PDF (this may take a while)...');
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const pdfPath = path.join(__dirname, 'allure-report', `allure-report-${timestamp}.pdf`);

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: false,
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size: 9px; width: 100%; text-align: center; color: #888; padding: 5px;">Allure Test Report</div>',
    footerTemplate: '<div style="font-size: 9px; width: 100%; text-align: center; color: #888; padding: 5px;">Page <span class="pageNumber"></span> of <span class="totalPages"></span> | Generated: ' + new Date().toLocaleString() + '</div>',
    margin: {
      top: '40px',
      right: '15px',
      bottom: '40px',
      left: '15px'
    },
    scale: 0.7
  });

  console.log(`✅ PDF generated successfully!`);
  console.log(`📁 Location: ${pdfPath}`);
  console.log(`\n💡 The browser was visible during generation so you could see what was captured.`);
  console.log(`💡 If the PDF still shows "loading", the Allure report may need to be served via HTTP.`);

  await browser.close();

  console.log(`\n🔍 Alternative: Try opening the report with:`);
  console.log(`   npx http-server allure-report -p 8080`);
  console.log(`   Then convert from: http://localhost:8080`);

})();

