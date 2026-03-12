const { chromium } = require('playwright');
const path = require('path');
const { spawn } = require('child_process');

(async () => {
  console.log('🚀 Generating Complete Allure PDF Report with All Screens...');

  // Start HTTP server for the Allure report
  console.log('🌐 Starting HTTP server...');
  const server = spawn('npx', ['http-server', 'allure-report', '-p', '9876', '-s', '-c-1'], {
    shell: true,
    stdio: 'pipe'
  });

  // Wait for server to start - increased wait time
  await new Promise(resolve => setTimeout(resolve, 5000));
  console.log('✅ Server started at http://localhost:9876');

  try {
    const browser = await chromium.launch({
      headless: true,
      args: ['--disable-web-security', '--no-sandbox', '--disable-dev-shm-usage']
    });

    const context = await browser.newContext({
      viewport: { width: 2560, height: 1440 }, // Larger viewport for more content
      deviceScaleFactor: 2 // Higher quality
    });

    const page = await context.newPage();

    console.log('📄 Loading Allure report from HTTP server...');
    await page.goto('http://localhost:9876/index.html', {
      waitUntil: 'networkidle',
      timeout: 90000
    });

    console.log('⏳ Waiting for Allure to fully load...');
    await page.waitForSelector('.app', { timeout: 30000 });

    // Wait for widgets to load - increased timeout
    await page.waitForFunction(() => {
      const widgets = document.querySelectorAll('.widget__title');
      return widgets.length > 0;
    }, { timeout: 30000 }).catch(() => console.log('Widgets may not be fully loaded'));

    // Wait for charts and initial content - significantly increased
    console.log('⏳ Waiting for charts and widgets to render...');
    await page.waitForTimeout(25000); // Increased from 15000 to 25000

    // Function to scroll through page content with more thorough scrolling
    const scrollPage = async () => {
      console.log('   📜 Scrolling to load all content...');
      await page.evaluate(async () => {
        await new Promise((resolve) => {
          let totalHeight = 0;
          const distance = 150; // Smaller steps for smoother loading
          const timer = setInterval(() => {
            window.scrollBy(0, distance);
            totalHeight += distance;

            if(totalHeight >= document.body.scrollHeight){
              clearInterval(timer);
              // Scroll back to top
              window.scrollTo(0, 0);
              setTimeout(resolve, 3000); // More time at end
            }
          }, 150); // Slower scrolling
        });
      });
    };

    // Function to wait for all loading indicators to disappear
    const waitForLoadingComplete = async () => {
      console.log('   ⏳ Waiting for loading indicators to disappear...');
      await page.waitForFunction(() => {
        const loaders = document.querySelectorAll('.loading, .spinner, [class*="loading"], [class*="spinner"]');
        const visibleLoaders = Array.from(loaders).filter(el => {
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
        });
        return visibleLoaders.length === 0;
      }, { timeout: 20000 }).catch(() => console.log('   Note: Some loading elements may still be present'));
    };

    // List of Allure report sections to capture
    const sections = [
      { name: 'Overview', hash: '#' },
      { name: 'Categories', hash: '#categories' },
      { name: 'Suites', hash: '#suites' },
      { name: 'Graphs', hash: '#graphs' },
      { name: 'Timeline', hash: '#timeline' },
      { name: 'Behaviors', hash: '#behaviors' },
      { name: 'Packages', hash: '#packages' }
    ];

    console.log('📊 Capturing all Allure sections...');

    const pdfPages = [];

    for (const section of sections) {
      console.log(`\n📄 Loading ${section.name} section...`);

      // Navigate to the section
      await page.goto(`http://localhost:9876/index.html${section.hash}`, {
        waitUntil: 'networkidle',
        timeout: 60000
      });

      // Wait for main app to be ready
      await page.waitForSelector('.app', { timeout: 20000 });

      // Wait for section-specific content to load
      console.log('   ⏳ Initial content load...');
      await page.waitForTimeout(12000); // Increased from 8000 to 12000

      // Wait for loading indicators to disappear
      await waitForLoadingComplete();

      // Additional wait for JavaScript to render everything
      console.log('   ⏳ Waiting for full render...');
      await page.waitForTimeout(8000); // Increased from 5000 to 8000

      // Scroll through the section to trigger lazy loading
      await scrollPage();

      // Wait after scrolling for any lazy-loaded content to render
      console.log('   ⏳ Final rendering wait...');
      await page.waitForTimeout(10000); // Increased from 5000 to 10000

      // Try to expand any collapsible sections
      try {
        await page.evaluate(() => {
          const expandButtons = document.querySelectorAll('[aria-expanded="false"]');
          expandButtons.forEach(btn => btn.click());
        });
        await page.waitForTimeout(2000);
      } catch (e) {
        // Ignore if no expandable sections
      }

      // Take a screenshot of this section for reference
      const screenshotPath = path.join(__dirname, 'allure-report', `temp-${section.name.toLowerCase()}.png`);
      console.log(`   📸 Taking screenshot...`);
      await page.screenshot({
        path: screenshotPath,
        fullPage: true
      });

      pdfPages.push(section.name);
      console.log(`   ✅ ${section.name} captured successfully`);
    }

    console.log('\n✅ All sections captured, generating combined PDF...');

    // Now generate the PDF by visiting each section again
    console.log('📝 Generating PDF with all sections...');
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const pdfPath = path.join(__dirname, 'allure-report', `allure-report-complete-${timestamp}.pdf`);

    const PDFDocument = require('pdfkit');
    const fs = require('fs');

    // Create a new PDF document
    const pdfDoc = new PDFDocument({
      size: 'A4',
      margin: 0,
      autoFirstPage: false
    });

    const stream = fs.createWriteStream(pdfPath);
    pdfDoc.pipe(stream);

    for (const section of sections) {
      console.log(`   📝 Adding ${section.name} to PDF...`);

      // Navigate to section
      await page.goto(`http://localhost:9876/index.html${section.hash}`, {
        waitUntil: 'networkidle',
        timeout: 60000
      });

      await page.waitForSelector('.app', { timeout: 20000 });
      await page.waitForTimeout(12000); // Increased from 8000 to 12000
      await waitForLoadingComplete();
      await page.waitForTimeout(8000); // Increased from 5000 to 8000
      await scrollPage();
      await page.waitForTimeout(10000); // Increased from 5000 to 10000

      // Expand any collapsible sections
      try {
        await page.evaluate(() => {
          const expandButtons = document.querySelectorAll('[aria-expanded="false"]');
          expandButtons.forEach(btn => btn.click());
        });
        await page.waitForTimeout(3000); // Increased from 2000 to 3000
      } catch (e) {
        // Ignore
      }

      // Take full page screenshot
      const buffer = await page.screenshot({
        fullPage: true,
        type: 'png'
      });

      // Calculate image dimensions for A4
      const img = pdfDoc.openImage(buffer);
      const pageWidth = 595.28; // A4 width in points
      const pageHeight = 841.89; // A4 height in points

      // Scale image to fit page width
      const scale = pageWidth / img.width;
      const scaledHeight = img.height * scale;

      // Add pages as needed for the full screenshot
      let remainingHeight = scaledHeight;
      let sourceY = 0;

      while (remainingHeight > 0) {
        pdfDoc.addPage({ size: 'A4', margin: 0 });

        const heightToDraw = Math.min(pageHeight, remainingHeight);
        const sourceHeightToDraw = heightToDraw / scale;

        pdfDoc.image(buffer, 0, 0, {
          fit: [pageWidth, pageHeight],
          align: 'center',
          valign: 'top'
        });

        // Add section title on first page of each section
        if (sourceY === 0) {
          // Add a semi-transparent background for the title
          pdfDoc.rect(5, 5, 200, 25).fillOpacity(0.8).fill('#FFFFFF');
          pdfDoc.fillOpacity(1);
          pdfDoc.fontSize(14)
             .font('Helvetica-Bold')
             .fillColor('#1D8AC4')
             .text(`${section.name}`, 10, 10);
        }

        remainingHeight -= pageHeight;
        sourceY += sourceHeightToDraw;
      }
    }

    pdfDoc.end();

    await new Promise(resolve => stream.on('finish', resolve));

    console.log(`\n✅ Complete PDF generated successfully!`);
    console.log(`📁 Location: ${pdfPath}`);
    console.log(`📄 Includes: ${pdfPages.join(', ')}`);
    console.log(`📊 Total sections: ${pdfPages.length}`);

    await browser.close();

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    // Stop the server
    console.log('\n🛑 Stopping HTTP server...');
    server.kill();
  }

  console.log('\n✅ Complete! Your PDF now includes all Allure report screens with full content loaded.');

})();
