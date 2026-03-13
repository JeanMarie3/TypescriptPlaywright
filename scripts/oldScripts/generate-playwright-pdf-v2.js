#!/usr/bin/env node

/**
 * Generate PDF from Playwright HTML Report - Version 2
 * Properly handles React-based Playwright reports with full content expansion
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const REPORT_DIR = path.join(__dirname, '../playwright-report');
const REPORT_HTML = path.join(REPORT_DIR, 'index.html');
const OUTPUT_DIR = path.join(__dirname, '../reports');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
const OUTPUT_FILE = path.join(OUTPUT_DIR, `playwright-report-${timestamp}.pdf`);

console.log('🎯 Converting Playwright HTML Report to PDF (v2)...\n');

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
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security'
      ]
    });

    const page = await browser.newPage();

    // Set larger viewport for better rendering
    await page.setViewport({ width: 1200, height: 800 });

    console.log('📄 Loading Playwright report...');
    const fileUrl = `file:///${REPORT_HTML.replace(/\\/g, '/')}`;
    await page.goto(fileUrl, {
      waitUntil: 'networkidle0',
      timeout: 60000
    });

    console.log('⏳ Waiting for React app to render...');

    // Wait for main container
    await page.waitForSelector('body', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('📂 Removing fixed heights and expanding all content...');

    // Inject CSS and JavaScript to force all content to display
    await page.evaluate(() => {
      // Remove all fixed heights and overflow hidden
      const style = document.createElement('style');
      style.textContent = `
        * {
          max-height: none !important;
          overflow: visible !important;
        }
        body, html {
          height: auto !important;
          overflow: visible !important;
        }
        /* Ensure all containers are visible */
        [style*="display: none"],
        [style*="display:none"],
        .hidden {
          display: block !important;
        }
        /* Remove scrollbars */
        ::-webkit-scrollbar {
          display: none;
        }
      `;
      document.head.appendChild(style);

      // Click all expandable elements
      const clickableSelectors = [
        'button',
        '[role="button"]',
        '[aria-expanded="false"]',
        '.chip',
        'summary',
        'details:not([open])'
      ];

      clickableSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          try {
            if (el.tagName === 'DETAILS') {
              el.setAttribute('open', 'true');
            } else {
              el.click();
            }
          } catch (e) {
            // Ignore errors
          }
        });
      });

      // Open all details elements
      document.querySelectorAll('details').forEach(detail => {
        detail.setAttribute('open', 'true');
      });

      // Force show all hidden elements
      document.querySelectorAll('[hidden]').forEach(el => {
        el.removeAttribute('hidden');
        el.style.display = 'block';
      });
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('📊 Generating PDF with proper pagination...');

    // Generate PDF with A4 format and natural page breaks
    await page.pdf({
      path: OUTPUT_FILE,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: false,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 10px; padding: 5px 15px; width: 100%; text-align: center; color: #666; border-bottom: 1px solid #ddd;">
          <span style="font-weight: bold;">Playwright Test Report</span>
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 9px; padding: 5px 15px; width: 100%; text-align: center; color: #666; border-top: 1px solid #ddd;">
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
          <span style="margin-left: 20px; color: #999;">Generated: ${new Date().toLocaleString()}</span>
        </div>
      `
    });

    console.log('✅ PDF generated successfully!');
    console.log(`📁 PDF location: ${OUTPUT_FILE}`);

    // Get file size
    const stats = fs.statSync(OUTPUT_FILE);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📦 File size: ${fileSizeInMB} MB\n`);

    await browser.close();

    console.log('🎉 Playwright report successfully converted to PDF!');
    console.log(`\n📖 You can now view: ${path.basename(OUTPUT_FILE)}\n`);

  } catch (error) {
    console.error('\n❌ Error generating PDF:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();

