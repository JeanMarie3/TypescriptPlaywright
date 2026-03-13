const htmlPdf = require('html-pdf-node');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('🚀 Generating Professional PDF Report using html-pdf-node...');

  try {
    // Read the Allure report HTML
    const htmlPath = path.join(__dirname, 'allure-report', 'index.html');

    if (!fs.existsSync(htmlPath)) {
      console.error('❌ Allure report not found. Run: npm run allure:generate');
      process.exit(1);
    }

    console.log('📄 Reading Allure report HTML...');
    let htmlContent = fs.readFileSync(htmlPath, 'utf8');

    // Inject script to wait for full load and expand content
    const injectedScript = `
      <script>
        window.addEventListener('load', function() {
          setTimeout(function() {
            // Expand all collapsible sections
            document.querySelectorAll('[aria-expanded="false"]').forEach(el => {
              try { el.click(); } catch(e) {}
            });
            
            // Mark as ready for PDF
            window.pdfReady = true;
          }, 10000);
        });
      </script>
    `;

    htmlContent = htmlContent.replace('</head>', injectedScript + '</head>');

    // Create temporary HTML file with injected scripts
    const tempHtmlPath = path.join(__dirname, 'allure-report', 'temp-for-pdf.html');
    fs.writeFileSync(tempHtmlPath, htmlContent);

    console.log('⏳ Generating PDF (this may take 2-3 minutes)...');

    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const pdfPath = path.join(__dirname, 'allure-report', `allure-report-html-pdf-${timestamp}.pdf`);

    const options = {
      format: 'A4',
      path: pdfPath,
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      },
      preferCSSPageSize: false,
      displayHeaderFooter: true,
      headerTemplate: '<div style="font-size: 9px; width: 100%; text-align: center; color: #666;">Allure Test Report</div>',
      footerTemplate: '<div style="font-size: 9px; width: 100%; text-align: center; color: #666;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
      scale: 0.8,
      waitUntil: 'networkidle0',
      timeout: 120000
    };

    const file = { url: `file://${tempHtmlPath}` };

    await htmlPdf.generatePdf(file, options);

    // Clean up temp file
    fs.unlinkSync(tempHtmlPath);

    console.log(`✅ PDF generated successfully!`);
    console.log(`📁 Location: ${pdfPath}`);
    console.log(`\n💡 This uses html-pdf-node library for better rendering.`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();

