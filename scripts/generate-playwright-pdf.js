#!/usr/bin/env node

/**
 * Generate PDF from Playwright HTML Report
 * Converts the default Playwright HTML report to a PDF document
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const REPORT_DIR = path.join(__dirname, '../playwright-report');
const REPORT_HTML = path.join(REPORT_DIR, 'index.html');
const OUTPUT_DIR = path.join(__dirname, '../reports');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
const OUTPUT_FILE = path.join(OUTPUT_DIR, `playwright-report-${timestamp}.pdf`);

console.log('🎯 Converting Playwright HTML Report to PDF...\n');

// Check if Playwright report exists
if (!fs.existsSync(REPORT_HTML)) {
  console.error('❌ Error: Playwright HTML report not found!');
  console.error(`   Expected location: ${REPORT_HTML}`);
  console.error('   Please run your tests first to generate the report.');
  console.error('   Command: npm test\n');
  process.exit(1);
}

(async () => {
  try {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      console.log('✅ Created output directory: reports/\n');
    }

    console.log('🌐 Launching browser...');
    const browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security'
      ]
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    console.log('📄 Loading Playwright report...');
    const fileUrl = `file:///${REPORT_HTML.replace(/\\/g, '/')}`;
    await page.goto(fileUrl, {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    console.log('⏳ Waiting for report to fully render...');

    // Wait for the main report container with proper React app selector
    await page.waitForSelector('[data-testid="report"], .report, #root', { timeout: 30000 }).catch(() => {
      console.log('⚠️  Main container found, continuing...');
    });

    // Wait for initial content to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Click on each test file to expand all tests
    console.log('📂 Expanding all test files...');
    const expandedCount = await page.evaluate(async () => {
      let count = 0;
      const delay = ms => new Promise(r => setTimeout(r, ms));

      // More comprehensive selectors for Playwright HTML report
      const clickableSelectors = [
        '[data-testid^="test-file-"]',
        '.test-file-title',
        '.test-file',
        '.test-file-path',
        'div[role="button"]',
        '.chip',
        '.test-case-title',
        '[data-testid^="test-case-"]',
        '.test-case',
        'button.test-file-test',
        '.test-file-test',
        '.test-result',
        '[aria-expanded="false"]'
      ];

      // Try to find and click all expandable elements
      for (const selector of clickableSelectors) {
        const elements = document.querySelectorAll(selector);
        console.log(`Found ${elements.length} elements matching: ${selector}`);

        for (const element of elements) {
          try {
            // Check if element is visible
            const rect = element.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              element.click();
              count++;
              await delay(200);
            }
          } catch (e) {
            // Ignore click errors
          }
        }
      }

      // Also try clicking any collapsed sections
      const allButtons = document.querySelectorAll('button, [role="button"]');
      console.log(`Found ${allButtons.length} buttons/clickable elements`);

      for (const button of allButtons) {
        try {
          const ariaExpanded = button.getAttribute('aria-expanded');
          if (ariaExpanded === 'false') {
            button.click();
            count++;
            await delay(150);
          }
        } catch (e) {
          // Ignore
        }
      }

      return count;
    });

    console.log(`✅ Expanded ${expandedCount} items`);
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Expand all details/collapsible sections
    console.log('📂 Expanding all collapsible sections...');
    await page.evaluate(() => {
      // Expand all <details> elements
      const detailsElements = document.querySelectorAll('details');
      console.log(`Expanding ${detailsElements.length} details elements`);
      detailsElements.forEach(detail => detail.setAttribute('open', 'true'));

      // Click all buttons that might expand content
      const buttons = document.querySelectorAll('button[aria-expanded="false"]');
      console.log(`Clicking ${buttons.length} collapsed buttons`);
      buttons.forEach(btn => {
        try {
          btn.click();
        } catch (e) {
          // Ignore
        }
      });

      // Force show any hidden content
      const hiddenElements = document.querySelectorAll('[hidden], .hidden');
      hiddenElements.forEach(el => {
        el.removeAttribute('hidden');
        el.style.display = 'block';
      });
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Click to show all screenshots and error details
    console.log('📸 Loading all screenshots and attachments...');
    await page.evaluate(() => {
      // Find and click attachment links
      const attachmentLinks = document.querySelectorAll('a[href*="attachment"], img[data-src], [data-testid*="attachment"]');
      attachmentLinks.forEach(link => {
        try {
          if (link.click) link.click();
        } catch (e) {
          // Ignore
        }
      });

      // Ensure lazy-loaded images are loaded
      const images = document.querySelectorAll('img[data-src]');
      images.forEach(img => {
        const dataSrc = img.getAttribute('data-src');
        if (dataSrc) {
          img.setAttribute('src', dataSrc);
        }
      });
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Scroll through the entire page to trigger lazy loading
    console.log('📜 Scrolling through entire report to load all content...');
    const finalHeight = await page.evaluate(async () => {
      const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

      // Get total scrollable height
      const getScrollHeight = () => Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      );

      let currentHeight = getScrollHeight();
      const viewportHeight = window.innerHeight;
      let scrollCount = 0;

      console.log(`Initial scroll height: ${currentHeight}px`);

      // Scroll down multiple times to ensure all content loads
      for (let iteration = 0; iteration < 3; iteration++) {
        console.log(`Scroll iteration ${iteration + 1}`);

        for (let position = 0; position < currentHeight; position += viewportHeight / 3) {
          window.scrollTo(0, position);
          await delay(400);
          scrollCount++;

          // Check if new content loaded
          const newHeight = getScrollHeight();
          if (newHeight > currentHeight) {
            console.log(`Height increased from ${currentHeight}px to ${newHeight}px`);
            currentHeight = newHeight;
          }
        }

        // Scroll to the very bottom
        window.scrollTo(0, currentHeight);
        await delay(1500);

        // Check again
        currentHeight = getScrollHeight();
      }

      console.log(`Final scroll height: ${currentHeight}px after ${scrollCount} scroll steps`);

      // Scroll back to top
      window.scrollTo(0, 0);
      await delay(1000);

      return currentHeight;
    });

    console.log(`✅ Final page height: ${finalHeight}px`);
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Count how many images we have
    const imageCount = await page.evaluate(() => {
      const images = document.querySelectorAll('img');
      console.log(`Total images found: ${images.length}`);
      return images.length;
    });

    console.log(`📸 Found ${imageCount} images in the report`);

    console.log('📊 Generating comprehensive PDF with all screenshots...');

    // Generate PDF with proper A4 pagination that allows content to flow across multiple pages
    await page.pdf({
      path: OUTPUT_FILE,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: false,
      margin: {
        top: '15mm',
        right: '10mm',
        bottom: '15mm',
        left: '10mm'
      },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 9px; padding: 5px 20px; width: 100%; text-align: center; color: #666; border-bottom: 1px solid #ddd;">
          <span style="font-weight: bold;">Playwright Test Report - Complete Results with Screenshots</span>
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 8px; padding: 5px 20px; width: 100%; text-align: center; color: #666; border-top: 1px solid #ddd;">
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
          <span style="margin-left: 30px; color: #999;">Generated: ${new Date().toLocaleString()}</span>
        </div>
      `,
      // Scale down content to fit width, let it flow naturally across pages
      scale: 0.8
    });

    console.log('✅ PDF generated successfully!');
    console.log(`📁 PDF location: ${OUTPUT_FILE}`);

    // Get file size
    const stats = fs.statSync(OUTPUT_FILE);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📦 File size: ${fileSizeInMB} MB\n`);

    await browser.close();

    console.log('🎉 Playwright report successfully converted to PDF!');
    console.log(`\n📖 You can now share or view: ${path.basename(OUTPUT_FILE)}\n`);

  } catch (error) {
    console.error('\n❌ Error generating PDF:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
