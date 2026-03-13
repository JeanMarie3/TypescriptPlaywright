const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('🚀 Generating Professional Allure-Style PDF Report...');

  try {
    // Read all test result files
    const resultsDir = path.join(__dirname, 'allure-results');
    const files = fs.readdirSync(resultsDir);
    const resultFiles = files.filter(f => f.endsWith('-result.json'));

    console.log(`📊 Found ${resultFiles.length} test results`);

    // Parse all test results
    const testResults = [];
    let passed = 0, failed = 0, skipped = 0, broken = 0;
    let totalDuration = 0;
    const suites = {};

    for (const file of resultFiles) {
      try {
        const content = fs.readFileSync(path.join(resultsDir, file), 'utf8');
        const result = JSON.parse(content);
        testResults.push(result);

        // Group by suite
        const suiteName = (result.labels && result.labels.find(l => l.name === 'suite'))?.value || 'Other Tests';
        if (!suites[suiteName]) {
          suites[suiteName] = { passed: 0, failed: 0, skipped: 0, broken: 0, tests: [] };
        }
        suites[suiteName].tests.push(result);

        // Count statuses
        if (result.status === 'passed') {
          passed++;
          suites[suiteName].passed++;
        } else if (result.status === 'failed') {
          failed++;
          suites[suiteName].failed++;
        } else if (result.status === 'skipped') {
          skipped++;
          suites[suiteName].skipped++;
        } else if (result.status === 'broken') {
          broken++;
          suites[suiteName].broken++;
        }

        // Sum duration
        if (result.stop && result.start) {
          totalDuration += (result.stop - result.start);
        }
      } catch (e) {
        console.log(`⚠️  Could not parse ${file}`);
      }
    }

    const total = testResults.length;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
    const avgDuration = total > 0 ? (totalDuration / total / 1000).toFixed(2) : 0;

    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`💔 Broken: ${broken}`);

    // Create PDF document
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const pdfPath = path.join(__dirname, 'allure-report', `allure-report-${timestamp}.pdf`);
    const doc = new PDFDocument({
      margin: 40,
      size: 'A4',
      bufferPages: true
    });
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    // Colors matching Allure theme
    const colors = {
      primary: '#1D8AC4',
      passed: '#97CC64',
      failed: '#FD5A3E',
      broken: '#D35EBE',
      skipped: '#FFCA28',
      gray: '#6C757D',
      lightGray: '#F8F9FA',
      darkGray: '#343A40'
    };

    // Helper functions
    const drawBox = (x, y, width, height, color, text, value, icon) => {
      doc.rect(x, y, width, height).fillAndStroke(color, '#E0E0E0');
      doc.fillColor('#FFFFFF').fontSize(11).text(icon, x + 15, y + 15);
      doc.fillColor('#FFFFFF').fontSize(24).font('Helvetica-Bold').text(value, x + 15, y + 35);
      doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica').text(text, x + 15, y + 65);
    };

    const drawProgressBar = (x, y, width, height, percentage, color) => {
      // Background
      doc.rect(x, y, width, height).fillAndStroke('#E0E0E0', '#E0E0E0');
      // Progress
      const filledWidth = (width * percentage) / 100;
      doc.rect(x, y, filledWidth, height).fillAndStroke(color, color);
    };

    // ====== PAGE 1: OVERVIEW ======

    // Header with Allure branding
    doc.rect(0, 0, 595, 80).fill(colors.primary);
    doc.fillColor('#FFFFFF').fontSize(32).font('Helvetica-Bold')
       .text('Allure Report', 40, 25);
    doc.fontSize(12).font('Helvetica')
       .text(`Generated: ${new Date().toLocaleString()}`, 40, 55);

    doc.fillColor('#000000');
    let yPos = 120;

    // Main Statistics Cards
    doc.fontSize(18).font('Helvetica-Bold').fillColor(colors.darkGray)
       .text('Test Execution Summary', 40, yPos);
    yPos += 40;

    const cardWidth = 120;
    const cardHeight = 90;
    const cardSpacing = 15;

    drawBox(40, yPos, cardWidth, cardHeight, colors.passed, 'PASSED', passed.toString(), '✓');
    drawBox(40 + cardWidth + cardSpacing, yPos, cardWidth, cardHeight, colors.failed, 'FAILED', failed.toString(), '✗');
    drawBox(40 + (cardWidth + cardSpacing) * 2, yPos, cardWidth, cardHeight, colors.broken, 'BROKEN', broken.toString(), '!');
    drawBox(40 + (cardWidth + cardSpacing) * 3, yPos, cardWidth, cardHeight, colors.skipped, 'SKIPPED', skipped.toString(), '○');

    yPos += cardHeight + 40;

    // Overall Statistics
    doc.fontSize(16).font('Helvetica-Bold').fillColor(colors.darkGray)
       .text('Overall Statistics', 40, yPos);
    yPos += 35;

    // Stats box
    doc.roundedRect(40, yPos, 515, 120, 5).fillAndStroke(colors.lightGray, '#E0E0E0');

    const statsY = yPos + 20;
    doc.fillColor(colors.darkGray).fontSize(12).font('Helvetica');

    doc.text('Total Tests:', 60, statsY);
    doc.font('Helvetica-Bold').text(total.toString(), 200, statsY);

    doc.font('Helvetica').text('Pass Rate:', 60, statsY + 25);
    doc.font('Helvetica-Bold').fillColor(parseFloat(passRate) >= 80 ? colors.passed : colors.failed)
       .text(`${passRate}%`, 200, statsY + 25);

    doc.fillColor(colors.darkGray).font('Helvetica').text('Total Duration:', 60, statsY + 50);
    doc.font('Helvetica-Bold').text(`${(totalDuration / 1000).toFixed(2)}s`, 200, statsY + 50);

    doc.font('Helvetica').text('Average Duration:', 60, statsY + 75);
    doc.font('Helvetica-Bold').text(`${avgDuration}s`, 200, statsY + 75);

    // Progress bar for pass rate
    doc.font('Helvetica').text('Success Rate:', 320, statsY);
    drawProgressBar(320, statsY + 20, 200, 20, parseFloat(passRate),
                     parseFloat(passRate) >= 80 ? colors.passed : colors.failed);
    doc.fontSize(10).fillColor('#FFFFFF').text(`${passRate}%`, 400, statsY + 23);

    yPos += 160;

    // Test distribution pie chart representation
    doc.fontSize(16).font('Helvetica-Bold').fillColor(colors.darkGray)
       .text('Test Distribution', 40, yPos);
    yPos += 35;

    const barY = yPos;
    const barHeight = 30;
    const totalBarWidth = 515;

    if (total > 0) {
      let currentX = 40;

      if (passed > 0) {
        const passedWidth = (passed / total) * totalBarWidth;
        doc.rect(currentX, barY, passedWidth, barHeight).fill(colors.passed);
        doc.fillColor('#FFFFFF').fontSize(11).text(passed, currentX + passedWidth / 2 - 10, barY + 8);
        currentX += passedWidth;
      }

      if (failed > 0) {
        const failedWidth = (failed / total) * totalBarWidth;
        doc.rect(currentX, barY, failedWidth, barHeight).fill(colors.failed);
        doc.fillColor('#FFFFFF').fontSize(11).text(failed, currentX + failedWidth / 2 - 10, barY + 8);
        currentX += failedWidth;
      }

      if (broken > 0) {
        const brokenWidth = (broken / total) * totalBarWidth;
        doc.rect(currentX, barY, brokenWidth, barHeight).fill(colors.broken);
        doc.fillColor('#FFFFFF').fontSize(11).text(broken, currentX + brokenWidth / 2 - 10, barY + 8);
        currentX += brokenWidth;
      }

      if (skipped > 0) {
        const skippedWidth = (skipped / total) * totalBarWidth;
        doc.rect(currentX, barY, skippedWidth, barHeight).fill(colors.skipped);
        doc.fillColor('#FFFFFF').fontSize(11).text(skipped, currentX + skippedWidth / 2 - 10, barY + 8);
      }
    }

    yPos += barHeight + 20;

    // Legend
    const legendY = yPos;
    const legendSpacing = 130;

    doc.rect(40, legendY, 15, 15).fill(colors.passed);
    doc.fillColor(colors.darkGray).fontSize(10).text('Passed', 60, legendY + 2);

    doc.rect(40 + legendSpacing, legendY, 15, 15).fill(colors.failed);
    doc.text('Failed', 60 + legendSpacing, legendY + 2);

    doc.rect(40 + legendSpacing * 2, legendY, 15, 15).fill(colors.broken);
    doc.text('Broken', 60 + legendSpacing * 2, legendY + 2);

    doc.rect(40 + legendSpacing * 3, legendY, 15, 15).fill(colors.skipped);
    doc.text('Skipped', 60 + legendSpacing * 3, legendY + 2);

    // ====== PAGE 2+: TEST SUITES ======
    doc.addPage();

    // Header
    doc.rect(0, 0, 595, 60).fill(colors.primary);
    doc.fillColor('#FFFFFF').fontSize(20).font('Helvetica-Bold')
       .text('Test Suites', 40, 20);

    yPos = 90;

    // Iterate through each suite
    for (const [suiteName, suiteData] of Object.entries(suites)) {
      if (yPos > 700) {
        doc.addPage();
        doc.rect(0, 0, 595, 60).fill(colors.primary);
        doc.fillColor('#FFFFFF').fontSize(20).font('Helvetica-Bold')
           .text('Test Suites (continued)', 40, 20);
        yPos = 90;
      }

      // Suite header
      doc.roundedRect(40, yPos, 515, 35, 3).fillAndStroke(colors.lightGray, colors.gray);
      doc.fillColor(colors.darkGray).fontSize(14).font('Helvetica-Bold')
         .text(suiteName, 50, yPos + 10);

      const suiteTotal = suiteData.tests.length;
      const suitePassRate = suiteTotal > 0 ? ((suiteData.passed / suiteTotal) * 100).toFixed(0) : 0;
      doc.fontSize(11).font('Helvetica')
         .text(`${suiteData.passed}/${suiteTotal} (${suitePassRate}%)`, 450, yPos + 12);

      yPos += 45;

      // Test list
      for (let i = 0; i < suiteData.tests.length; i++) {
        const test = suiteData.tests[i];

        if (yPos > 720) {
          doc.addPage();
          doc.rect(0, 0, 595, 60).fill(colors.primary);
          doc.fillColor('#FFFFFF').fontSize(20).font('Helvetica-Bold')
             .text('Test Suites (continued)', 40, 20);
          yPos = 90;
        }

        // Status indicator
        let statusColor = colors.passed;
        let statusIcon = '✓';
        if (test.status === 'failed') {
          statusColor = colors.failed;
          statusIcon = '✗';
        } else if (test.status === 'broken') {
          statusColor = colors.broken;
          statusIcon = '!';
        } else if (test.status === 'skipped') {
          statusColor = colors.skipped;
          statusIcon = '○';
        }

        // Status circle
        doc.circle(50, yPos + 5, 8).fillAndStroke(statusColor, statusColor);
        doc.fillColor('#FFFFFF').fontSize(10).text(statusIcon, 47, yPos + 1);

        // Test name
        const testName = test.name || 'Unknown Test';
        doc.fillColor(colors.darkGray).fontSize(10).font('Helvetica')
           .text(testName, 70, yPos + 2, { width: 380, ellipsis: true });

        // Duration
        if (test.stop && test.start) {
          const duration = ((test.stop - test.start) / 1000).toFixed(2);
          doc.fillColor(colors.gray).fontSize(9)
             .text(`${duration}s`, 480, yPos + 2);
        }

        yPos += 20;

        // Error message for failed/broken tests
        if ((test.status === 'failed' || test.status === 'broken') &&
            test.statusDetails && test.statusDetails.message) {
          const errorMsg = test.statusDetails.message.substring(0, 150);
          doc.fontSize(8).fillColor('#DC3545')
             .text(`Error: ${errorMsg}${errorMsg.length >= 150 ? '...' : ''}`,
                    70, yPos, { width: 450 });
          yPos += 15;
        }
      }

      yPos += 20;
    }

    // Add page numbers
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(9).fillColor(colors.gray)
         .text(`Page ${i + 1} of ${pageCount}`, 40, 800, { align: 'center', width: 515 });
    }

    // Finalize PDF
    doc.end();

    stream.on('finish', () => {
      console.log(`✅ Professional Allure-style PDF generated successfully!`);
      console.log(`📁 Location: ${pdfPath}`);
      console.log(`📄 Pages: ${pageCount}`);
      console.log(`\n💡 This PDF includes proper Allure styling with charts and statistics.`);
    });

  } catch (error) {
    console.error('❌ Error generating PDF:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
