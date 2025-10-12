#!/usr/bin/env node

/**
 * Executive PDF Report Generator
 * Creates a comprehensive PDF with all test results and screenshots
 * Perfect for management presentations
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ALLURE_REPORT_DIR = path.join(__dirname, '../allure-report');
const ALLURE_INDEX = path.join(ALLURE_REPORT_DIR, 'index.html');
const OUTPUT_DIR = path.join(__dirname, '../reports');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
const OUTPUT_FILE = path.join(OUTPUT_DIR, `executive-report-${timestamp}.pdf`);

console.log('📊 Generating Executive PDF Report with Screenshots...\n');

if (!fs.existsSync(ALLURE_INDEX)) {
  console.error('❌ Error: Allure report not found!');
  console.error('   Please run: npm run allure:generate');
  process.exit(1);
}

(async () => {
  try {
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    console.log('🌐 Launching browser...');
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--allow-file-access-from-files'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1600, height: 1200 });

    console.log('📄 Loading Allure report...');
    const fileUrl = `file:///${ALLURE_INDEX.replace(/\\/g, '/')}`;
    await page.goto(fileUrl, {
      waitUntil: 'networkidle0',
      timeout: 90000
    });

    console.log('⏳ Waiting for Allure to render...');
    await page.waitForSelector('.app', { timeout: 15000 });
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('🔧 Expanding all test content...');

    const reportInfo = await page.evaluate(async () => {
      const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

      // Inject CSS to ensure everything is visible
      const style = document.createElement('style');
      style.textContent = `
        * {
          overflow: visible !important;
          max-height: none !important;
        }
        body, html, .app {
          height: auto !important;
          overflow: visible !important;
        }
        img {
          max-width: 100% !important;
          height: auto !important;
          display: block !important;
        }
        .pane {
          overflow: visible !important;
          max-height: none !important;
        }
      `;
      document.head.appendChild(style);

      let clickCount = 0;
      let screenshotCount = 0;

      // Click through all test cases (multiple passes)
      for (let pass = 0; pass < 3; pass++) {
        // Click all tree nodes to expand
        const treeNodes = document.querySelectorAll(
          '.tree__node, .tree-leaf, [class*="tree"], [class*="suite"]'
        );

        for (const node of treeNodes) {
          try {
            if (node.offsetWidth > 0 && node.offsetHeight > 0) {
              node.click();
              clickCount++;
              await delay(100);
            }
          } catch (e) {
            // Ignore
          }
        }

        await delay(1500);
      }

      // Expand all attachments/screenshots
      const attachmentLinks = document.querySelectorAll(
        'a[href*="png"], a[href*="jpg"], [class*="attachment"]'
      );

      for (const link of attachmentLinks) {
        try {
          link.click();
          await delay(200);
        } catch (e) {
          // Ignore
        }
      }

      // Count images
      const images = document.querySelectorAll('img');
      for (const img of images) {
        if (img.src && img.src.includes('data/')) {
          screenshotCount++;
        }
      }

      // Scroll to load everything
      const scrollHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      );

      for (let y = 0; y < scrollHeight; y += 400) {
        window.scrollTo(0, y);
        await delay(150);
      }

      window.scrollTo(0, 0);
      await delay(2000);

      return {
        clicks: clickCount,
        screenshots: screenshotCount,
        height: scrollHeight
      };
    });

    console.log(`✅ Expanded ${reportInfo.clicks} elements`);
    console.log(`📸 Found ${reportInfo.screenshots} screenshots`);
    console.log(`📏 Page height: ${reportInfo.height}px`);

    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('📊 Generating executive PDF...');

    await page.pdf({
      path: OUTPUT_FILE,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 11px; padding: 8px 20px; width: 100%; text-align: center; color: #333; border-bottom: 2px solid #4CAF50;">
          <strong>Test Execution Report - Quality Assurance Dashboard</strong>
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 9px; padding: 8px 20px; width: 100%; text-align: center; color: #666; border-top: 1px solid #ddd;">
          <span style="font-weight: bold;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
          <span style="margin: 0 20px;">|</span>
          <span>Generated: ${new Date().toLocaleString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</span>
          <span style="margin: 0 20px;">|</span>
          <span style="color: #4CAF50;">Confidential</span>
        </div>
      `
    });

    const stats = fs.statSync(OUTPUT_FILE);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

    await browser.close();

    console.log('\n✅ Executive PDF Report Generated Successfully!');
    console.log('═══════════════════════════════════════════════════');
    console.log(`📁 Location: ${OUTPUT_FILE}`);
    console.log(`📦 Size: ${fileSizeInMB} MB`);
    console.log(`📸 Screenshots: ${reportInfo.screenshots}`);
    console.log('═══════════════════════════════════════════════════');
    console.log('\n🎉 Report ready for management presentation!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();

