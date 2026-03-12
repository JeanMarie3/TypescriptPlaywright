#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const PDFDocument = require('pdfkit');

const TEST_RESULTS_DIR = path.join(__dirname, '..', 'test-results');
const OUTPUT_DIR = path.join(__dirname, '..', 'reports');

// Status colors inspired by allure-pdf
const STATUS_COLORS = {
  passed: '#97cc64',
  failed: '#fd5a3e',
  broken: '#ffd050',
  skipped: '#aaaaaa'
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadTestArtifacts() {
  if (!fs.existsSync(TEST_RESULTS_DIR)) {
    throw new Error(`test-results folder not found at ${TEST_RESULTS_DIR}`);
  }

  const entries = fs.readdirSync(TEST_RESULTS_DIR, { withFileTypes: true });
  const tests = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const testDir = path.join(TEST_RESULTS_DIR, entry.name);
    const files = fs.readdirSync(testDir);

    const screenshots = files.filter(f => f.toLowerCase().endsWith('.png')).map(f => path.join(testDir, f));
    const videos = files.filter(f => f.toLowerCase().endsWith('.webm')).map(f => path.join(testDir, f));
    const errorMd = files.filter(f => f.toLowerCase().endsWith('.md')).map(f => path.join(testDir, f));

    const status = errorMd.length > 0 ? 'failed' : 'passed';

    tests.push({
      id: entry.name,
      displayName: makeReadableName(entry.name),
      dir: testDir,
      screenshots,
      videos,
      errorMd,
      status
    });
  }

  tests.sort((a, b) => a.displayName.localeCompare(b.displayName));
  return tests;
}

function makeReadableName(folderName) {
  // Turn slug-like names into something readable; keep the original if already friendly.
  return folderName
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatDateTime(date = new Date()) {
  return date.toISOString().replace(/T/, ' ').replace(/\.\d+Z$/, ' UTC');
}

function addSectionTitle(doc, text) {
  if (doc.y > doc.page.height - 80) doc.addPage();
  doc.font('Helvetica-Bold').fontSize(16).fillColor('#111').text(text, { underline: true });
  doc.moveDown(0.6);
}

function addCoverPage(doc, tests) {
  const passedCount = tests.filter(t => t.status === 'passed').length;
  const failedCount = tests.filter(t => t.status === 'failed').length;
  const passRate = tests.length > 0 ? ((passedCount / tests.length) * 100).toFixed(1) : 0;

  // Add spacing from top
  doc.moveDown(8);

  // Main title
  doc.font('Helvetica-Bold').fontSize(32).fillColor('#1976D2').text('Test Execution Report', { align: 'center' });
  doc.moveDown(2);

  // Project name
  doc.font('Helvetica-Bold').fontSize(18).fillColor('#424242').text('TypeScript Playwright Automation', { align: 'center' });
  doc.moveDown(3);

  // Summary stats in center
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#111');
  doc.text(`Total Tests: ${tests.length}`, { align: 'center' });
  doc.moveDown(0.5);

  doc.fillColor('#2e7d32').text(`Passed: ${passedCount}`, { align: 'center' });
  doc.moveDown(0.5);

  doc.fillColor('#c0392b').text(`Failed: ${failedCount}`, { align: 'center' });
  doc.moveDown(0.5);

  doc.fillColor(passRate >= 80 ? '#2e7d32' : '#c0392b')
    .text(`Pass Rate: ${passRate}%`, { align: 'center' });
  doc.moveDown(3);

  // Metadata section
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#757575');
  doc.text('Report Details', { align: 'center' });
  doc.moveDown(0.5);

  doc.font('Helvetica').fontSize(10).fillColor('#111');
  doc.text(`Generated: ${formatDateTime()}`, { align: 'center' });
  doc.text(`Source: test-results`, { align: 'center' });
  doc.text(`Environment: ${os.hostname()} (${os.platform()} ${os.release()})`, { align: 'center' });

  doc.moveDown(4);

  // Footer note
  doc.font('Helvetica-Oblique').fontSize(9).fillColor('#9e9e9e');
  doc.text('This report is automatically generated from Playwright test execution results', { align: 'center' });
}

function addExecutionSummaryTable(doc, tests) {
  const total = tests.length;
  const failed = tests.filter(t => t.status === 'failed').length;
  const passed = total - failed;
  const rows = [
    ['Metric', 'Value'],
    ['Total tests', `${total}`],
    ['Passed', `${passed}`],
    ['Failed', `${failed}`],
    ['Generated', formatDateTime()],
    ['Host', `${os.hostname()} (${os.platform()} ${os.release()})`]
  ];

  doc.font('Helvetica-Bold').fontSize(16).fillColor('#111').text('Execution Summary');
  doc.moveDown(0.8);

  const tableTop = doc.y;
  const colWidths = [200, doc.page.width - doc.page.margins.left - doc.page.margins.right - 200];
  const rowHeight = 25;
  const startX = doc.x;

  rows.forEach((row, idx) => {
    const isHeader = idx === 0;
    const y = tableTop + (idx * rowHeight);

    if (y > doc.page.height - 100) {
      doc.addPage();
      return;
    }

    // Draw cell backgrounds
    if (isHeader) {
      doc.fillColor('#263238').rect(startX, y, colWidths[0] + colWidths[1], rowHeight).fill();
    } else if (idx % 2 === 0) {
      doc.fillColor('#f5f5f5').rect(startX, y, colWidths[0] + colWidths[1], rowHeight).fill();
    }

    // Draw borders
    doc.strokeColor('#dddddd').lineWidth(0.5);
    doc.rect(startX, y, colWidths[0], rowHeight).stroke();
    doc.rect(startX + colWidths[0], y, colWidths[1], rowHeight).stroke();

    // Draw text
    doc.font(isHeader ? 'Helvetica-Bold' : 'Helvetica').fontSize(11);
    doc.fillColor(isHeader ? '#ffffff' : '#111');
    doc.text(row[0], startX + 5, y + 7, { width: colWidths[0] - 10, align: 'left' });
    doc.text(row[1], startX + colWidths[0] + 5, y + 7, { width: colWidths[1] - 10, align: 'left' });
  });

  doc.y = tableTop + (rows.length * rowHeight) + 10;
  doc.moveDown();
}

function addTestSummary(doc, tests) {
  const total = tests.length;
  const failed = tests.filter(t => t.status === 'failed').length;
  const passed = total - failed;

  addSectionTitle(doc, 'Summary');

  const rows = [
    ['Metric', 'Value'],
    ['Total tests', `${total}`],
    ['Passed (no error-context.md found)', `${passed}`],
    ['Failed (error-context.md present)', `${failed}`]
  ];

  const tableTop = doc.y;
  const colWidths = [280, doc.page.width - doc.page.margins.left - doc.page.margins.right - 280];
  const rowHeight = 25;
  const startX = doc.x;

  rows.forEach((row, idx) => {
    const isHeader = idx === 0;
    const y = tableTop + (idx * rowHeight);

    if (y > doc.page.height - 100) {
      doc.addPage();
      return;
    }

    // Draw cell backgrounds
    if (isHeader) {
      doc.fillColor('#263238').rect(startX, y, colWidths[0] + colWidths[1], rowHeight).fill();
    } else if (idx % 2 === 0) {
      doc.fillColor('#f5f5f5').rect(startX, y, colWidths[0] + colWidths[1], rowHeight).fill();
    }

    // Draw borders
    doc.strokeColor('#dddddd').lineWidth(0.5);
    doc.rect(startX, y, colWidths[0], rowHeight).stroke();
    doc.rect(startX + colWidths[0], y, colWidths[1], rowHeight).stroke();

    // Draw text
    doc.font(isHeader ? 'Helvetica-Bold' : 'Helvetica').fontSize(11);
    doc.fillColor(isHeader ? '#ffffff' : '#111');
    doc.text(row[0], startX + 5, y + 7, { width: colWidths[0] - 10, align: 'left' });
    doc.text(row[1], startX + colWidths[0] + 5, y + 7, { width: colWidths[1] - 10, align: 'left' });
  });

  doc.y = tableTop + (rows.length * rowHeight) + 10;
  doc.moveDown();
}

function addTestTable(doc, tests) {
  addSectionTitle(doc, 'Test Summary Table');

  const tableTop = doc.y;
  const colWidths = [100, doc.page.width - doc.page.margins.left - doc.page.margins.right - 100];
  const rowHeight = 25;
  const startX = doc.x;

  // Header row
  const headerY = tableTop;
  doc.fillColor('#263238').rect(startX, headerY, colWidths[0] + colWidths[1], rowHeight).fill();
  doc.strokeColor('#dddddd').lineWidth(0.5);
  doc.rect(startX, headerY, colWidths[0], rowHeight).stroke();
  doc.rect(startX + colWidths[0], headerY, colWidths[1], rowHeight).stroke();
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#ffffff');
  doc.text('Status', startX + 5, headerY + 7, { width: colWidths[0] - 10, align: 'left' });
  doc.text('Test', startX + colWidths[0] + 5, headerY + 7, { width: colWidths[1] - 10, align: 'left' });

  let currentY = headerY + rowHeight;

  for (let idx = 0; idx < tests.length; idx++) {
    const test = tests[idx];

    if (currentY > doc.page.height - 100) {
      doc.addPage();
      currentY = 50;
    }

    // Draw cell backgrounds
    if (idx % 2 === 0) {
      doc.fillColor('#f5f5f5').rect(startX, currentY, colWidths[0] + colWidths[1], rowHeight).fill();
    }

    // Draw borders
    doc.strokeColor('#dddddd').lineWidth(0.5);
    doc.rect(startX, currentY, colWidths[0], rowHeight).stroke();
    doc.rect(startX + colWidths[0], currentY, colWidths[1], rowHeight).stroke();

    // Draw text with allure-pdf colors
    const statusLabel = test.status === 'failed' ? 'FAILED' : 'PASSED';
    const statusColor = STATUS_COLORS[test.status] || STATUS_COLORS.skipped;

    doc.font('Helvetica-Bold').fontSize(11).fillColor(statusColor);
    doc.text(statusLabel, startX + 5, currentY + 7, { width: colWidths[0] - 10, align: 'left' });

    doc.font('Helvetica').fontSize(11).fillColor('#111');
    doc.text(test.displayName, startX + colWidths[0] + 5, currentY + 7, { width: colWidths[1] - 10, align: 'left' });

    currentY += rowHeight;
  }

  doc.y = currentY + 10;
  doc.moveDown();
}

function addTestsWithScreenshots(doc, tests) {
  addSectionTitle(doc, 'Test Details');

  for (const test of tests) {
    if (doc.y > doc.page.height - 200) doc.addPage();

    // Test header with status badge
    const statusColor = STATUS_COLORS[test.status] || STATUS_COLORS.skipped;
    const statusBgColor = test.status === 'failed' ? '#fff5f5' : '#f0fdf4';

    // Draw status badge background
    const headerY = doc.y;
    doc.fillColor(statusBgColor).rect(doc.x, headerY, doc.page.width - doc.page.margins.left - doc.page.margins.right, 30).fill();

    // Test name
    doc.font('Helvetica-Bold').fontSize(13).fillColor('#111').text(test.displayName, doc.x + 10, headerY + 8);

    // Status badge on the right
    const statusText = test.status.toUpperCase();
    const statusWidth = doc.widthOfString(statusText) + 20;
    const statusX = doc.page.width - doc.page.margins.right - statusWidth - 10;
    doc.fillColor(statusColor).rect(statusX, headerY + 5, statusWidth, 20).fill();
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#ffffff').text(statusText, statusX + 10, headerY + 10);

    doc.y = headerY + 35;

    // Test metadata
    doc.font('Helvetica').fontSize(10).fillColor('#666');
    doc.text(`Test ID: ${test.id}`, { indent: 10 });

    if (test.videos.length) {
      doc.text(`Video Recording: ${path.basename(test.videos[0])}`, { indent: 10 });
    }

    if (test.errorMd.length) {
      doc.fillColor('#fd5a3e').text(`⚠ Error Context Available: ${path.basename(test.errorMd[0])}`, { indent: 10 });
    }

    doc.moveDown(0.5);

    // Screenshot section
    if (test.screenshots.length) {
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#111').text('Screenshot:', { indent: 10 });
      doc.moveDown(0.3);

      const imgPath = test.screenshots[0];
      try {
        const maxWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right - 20;
        const maxHeight = 300;

        // Check if we need a new page for the image
        if (doc.y + maxHeight > doc.page.height - 60) {
          doc.addPage();
        }

        doc.image(imgPath, doc.x + 10, doc.y, { fit: [maxWidth, maxHeight] });
        doc.moveDown(maxHeight / 12); // Approximate spacing after image
      } catch (err) {
        doc.fillColor('#fd5a3e').text(`⚠ Unable to render screenshot: ${err.message}`, { indent: 10 });
      }
    } else {
      doc.font('Helvetica-Oblique').fontSize(10).fillColor('#9e9e9e').text('No screenshot available', { indent: 10 });
    }

    doc.moveDown(1.5);

    // Separator line
    doc.strokeColor('#e0e0e0').lineWidth(0.5).moveTo(doc.x, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).stroke();
    doc.moveDown(1);
  }
}

function generatePdf(tests) {
  ensureDir(OUTPUT_DIR);
  const outputFile = path.join(
    OUTPUT_DIR,
    `test-results-report-${new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)}.pdf`
  );

  const doc = new PDFDocument({ margin: 50, autoFirstPage: true });
  const stream = fs.createWriteStream(outputFile);
  doc.pipe(stream);

  addCoverPage(doc, tests);
  doc.addPage();
  addExecutionSummaryTable(doc, tests);
  addTestSummary(doc, tests);
  addTestTable(doc, tests);
  addTestsWithScreenshots(doc, tests);

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(outputFile));
    stream.on('error', reject);
  });
}

(async () => {
  try {
    console.log('📂 Collecting artifacts from test-results...');
    console.log(`Looking for: ${TEST_RESULTS_DIR}`);

    const tests = loadTestArtifacts();
    if (!tests.length) {
      throw new Error('No test artifacts found in test-results');
    }

    console.log(`✅ Found ${tests.length} test folders`);
    const failed = tests.filter(t => t.status === 'failed').length;
    console.log(`   • Passed: ${tests.length - failed}`);
    console.log(`   • Failed: ${failed}`);

    console.log('📝 Building PDF report...');
    const output = await generatePdf(tests);
    console.log(`✅ Report generated successfully!`);
    console.log(`📁 Location: ${output}`);

    const stats = fs.statSync(output);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📦 Size: ${fileSizeInMB} MB\n`);
  } catch (err) {
    console.error('\n❌ Failed to generate PDF from test-results:');
    console.error(`   Error: ${err.message}`);
    console.error(`   Stack: ${err.stack}`);
    process.exit(1);
  }
})();
