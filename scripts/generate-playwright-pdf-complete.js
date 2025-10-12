#!/usr/bin/env node

/**
 * Generate Complete PDF from Playwright HTML Report
 * Forces all content to display before PDF generation
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const REPORT_DIR = path.join(__dirname, '../playwright-report');
const REPORT_HTML = path.join(REPORT_DIR, 'index.html');
const OUTPUT_DIR = path.join(__dirname, '../reports');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
const OUTPUT_FILE = path.join(OUTPUT_DIR, `playwright-complete-${timestamp}.pdf`);

console.log('🎯 Converting Playwright HTML Report to Complete PDF...\n');

if (!fs.existsSync(REPORT_HTML)) {
  console.error('❌ Error: Playwright HTML report not found!');
  console.error(`   Expected location: ${REPORT_HTML}`);
  console.error('   Please run your tests first.');
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
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    console.log('📄 Loading Playwright report...');
    const fileUrl = `file:///${REPORT_HTML.replace(/\\/g, '/')}`;
    await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 60000 });

    console.log('⏳ Waiting for content to load...');
    await page.waitForSelector('body', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('🔧 Forcing all content to expand...');

    const contentInfo = await page.evaluate(async () => {
      // Comprehensive content expansion
      const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

      // 1. Remove all scrollbars and height restrictions
      const globalStyle = document.createElement('style');
      globalStyle.textContent = `
        * {
          max-height: none !important;
          overflow: visible !important;
        }
        body, html, #root, [class*="App"], [class*="app"] {
          height: auto !important;
          min-height: auto !important;
          overflow: visible !important;
        }
        [style*="overflow: hidden"],
        [style*="overflow:hidden"],
        [style*="max-height"] {
          overflow: visible !important;
          max-height: none !important;
        }
        .hidden {
          display: block !important;
          visibility: visible !important;
        }
        /* Ensure images are visible and properly sized */
        img {
          display: block !important;
          max-width: 100% !important;
          height: auto !important;
          visibility: visible !important;
        }
      `;
      document.head.appendChild(globalStyle);

      // 2. Click all expandable elements multiple times
      const clickAttempts = 5; // Increased attempts
      let totalClicks = 0;

      for (let attempt = 0; attempt < clickAttempts; attempt++) {
        // Find and click all possible expandable elements
        const selectors = [
          'button:not([disabled])',
          '[role="button"]:not([aria-disabled="true"])',
          '[aria-expanded="false"]',
          'summary',
          '.chip',
          '[class*="expandable"]',
          '[class*="collaps"]',
          '[data-testid*="expand"]',
          '[data-testid*="toggle"]',
          '[class*="test-file"]',
          '[class*="test-case"]',
          'a[href*="#"]', // Links that might expand content
          '.test-file-title',
          '.test-case-title'
        ];

        let clickCount = 0;
        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          for (const el of elements) {
            try {
              const rect = el.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                el.click();
                clickCount++;
                await delay(50); // Faster clicks
              }
            } catch (e) {
              // Ignore
            }
          }
        }

        totalClicks += clickCount;
        console.log(`Attempt ${attempt + 1}: Clicked ${clickCount} elements`);
        await delay(1000);
      }

      // 3. Force open all <details> elements
      document.querySelectorAll('details').forEach(detail => {
        detail.setAttribute('open', 'true');
        detail.open = true;
      });

      // 4. Remove hidden attributes
      document.querySelectorAll('[hidden]').forEach(el => {
        el.removeAttribute('hidden');
        el.style.display = '';
      });

      // 5. Force display on common hidden classes
      document.querySelectorAll('[style*="display: none"], [style*="display:none"]').forEach(el => {
        el.style.display = '';
      });

      // 6. Find and load all images with better detection
      console.log('Loading images...');
      const images = document.querySelectorAll('img, [data-testid*="screenshot"], [data-testid*="image"]');
      let imageCount = 0;

      for (const img of images) {
        if (img.tagName === 'IMG') {
          // Force load images with data-src or lazy loading
          if (img.dataset.src) {
            img.src = img.dataset.src;
          }

          // Make images visible
          img.style.display = 'block';
          img.style.visibility = 'visible';
          img.style.opacity = '1';

          // Remove lazy loading
          img.loading = 'eager';

          if (img.src && img.src !== '') {
            imageCount++;
          }
        }
      }

      // Also check for background images in divs
      document.querySelectorAll('[style*="background-image"]').forEach(el => {
        el.style.display = 'block';
        el.style.visibility = 'visible';
      });

      // Wait for all images to load with longer timeout
      await Promise.all(
        Array.from(document.querySelectorAll('img')).map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
            setTimeout(resolve, 5000); // Longer timeout for large screenshots
          });
        })
      );

      console.log(`Found ${imageCount} images`);

      // 7. Scroll through page multiple times to trigger all lazy loading
      const scrollHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      );

      // First pass - fast scroll
      for (let y = 0; y < scrollHeight; y += 300) {
        window.scrollTo(0, y);
        await delay(100);
      }

      // Second pass - slower for screenshots
      for (let y = 0; y < scrollHeight; y += 500) {
        window.scrollTo(0, y);
        await delay(200);
      }

      window.scrollTo(0, 0);
      await delay(2000);

      // Return page information with better test detection
      const testElements = document.querySelectorAll(
        '[data-testid*="test"], .test-file, .test-case, [class*="test-"]'
      );

      return {
        finalHeight: Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight
        ),
        testCount: testElements.length,
        buttonCount: document.querySelectorAll('button').length,
        imageCount: imageCount,
        totalClicks: totalClicks,
        actualImages: document.querySelectorAll('img[src]').length
      };
    });

    console.log(`✅ Content expanded: ${contentInfo.testCount} tests found`);
    console.log(`📸 Images loaded: ${contentInfo.imageCount} screenshots`);
    console.log(`🖱️  Total clicks: ${contentInfo.totalClicks} elements expanded`);
    console.log(`📏 Page height: ${contentInfo.finalHeight}px`);

    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('📊 Generating comprehensive PDF...');

    await page.pdf({
      path: OUTPUT_FILE,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '15mm',
        right: '12mm',
        bottom: '15mm',
        left: '12mm'
      },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 10px; padding: 5px 15px; width: 100%; text-align: center; color: #666;">
          <strong>Playwright Test Report - Complete Results</strong>
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 9px; padding: 5px 15px; width: 100%; text-align: center; color: #666;">
          Page <span class="pageNumber"></span> / <span class="totalPages"></span>
          <span style="margin-left: 15px; color: #999;">${new Date().toLocaleDateString()}</span>
        </div>
      `
    });

    const stats = fs.statSync(OUTPUT_FILE);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log('\n✅ PDF generated successfully!');
    console.log(`📁 Location: ${OUTPUT_FILE}`);
    console.log(`📦 Size: ${fileSizeInMB} MB`);
    console.log(`📄 Tests included: ${contentInfo.testCount}`);

    await browser.close();

    console.log('\n🎉 Done! Your complete Playwright report is ready.\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
