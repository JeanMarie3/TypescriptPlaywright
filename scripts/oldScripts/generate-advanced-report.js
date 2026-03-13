#!/usr/bin/env node

/**
 * Advanced Professional Test Report Generator - Alternative Version
 *
 * Features:
 * - Modern, clean design with visual charts
 * - Test case grouping by suite/category
 * - Pass rate visualization
 * - Timeline view of test execution
 * - Screenshot thumbnails with full-size versions
 * - Executive summary with key metrics
 * - Test duration analysis
 * - Failure patterns and insights
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const RESULTS_DIR = path.join(__dirname, '../allure-results');
const OUTPUT_DIR = path.join(__dirname, '../reports');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
const OUTPUT_FILE = path.join(OUTPUT_DIR, `advanced-test-report-${timestamp}.pdf`);

// Color scheme for modern look
const COLORS = {
  primary: '#1E3A8A',      // Deep blue
  success: '#10B981',      // Green
  warning: '#F59E0B',      // Amber
  danger: '#EF4444',       // Red
  info: '#3B82F6',         // Blue
  text: '#1F2937',         // Dark gray
  textLight: '#6B7280',    // Light gray
  background: '#F9FAFB',   // Very light gray
  border: '#E5E7EB'        // Border gray
};

console.log('📊 Creating Advanced Professional Test Report...\n');

if (!fs.existsSync(RESULTS_DIR)) {
  console.error('❌ Error: Test results not found!');
  console.error('   Please run tests first: npm test');
  process.exit(1);
}

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Read and parse test results
console.log('📖 Reading and analyzing test results...');
const files = fs.readdirSync(RESULTS_DIR);
const resultFiles = files.filter(f => f.endsWith('-result.json'));
const screenshotFiles = files.filter(f => f.endsWith('.png'));
const videoFiles = files.filter(f => f.endsWith('.webm'));

console.log(`   Found ${resultFiles.length} test results`);
console.log(`   Found ${screenshotFiles.length} screenshots`);
console.log(`   Found ${videoFiles.length} videos`);

const testResults = resultFiles.map(file => {
  try {
    const content = fs.readFileSync(path.join(RESULTS_DIR, file), 'utf8');
    return JSON.parse(content);
  } catch (e) {
    return null;
  }
}).filter(r => r !== null);

// Analyze test results
const passed = testResults.filter(t => t.status === 'passed');
const failed = testResults.filter(t => t.status === 'failed');
const broken = testResults.filter(t => t.status === 'broken');
const skipped = testResults.filter(t => t.status === 'skipped');

const totalDuration = testResults.reduce((sum, t) => {
  return sum + (t.stop && t.start ? (t.stop - t.start) : 0);
}, 0);

const avgDuration = testResults.length > 0 ? totalDuration / testResults.length : 0;
const passRate = testResults.length > 0 ? (passed.length / testResults.length * 100).toFixed(1) : 0;

// Group tests by suite/file
const testsByFile = {};
testResults.forEach(test => {
  const suite = (test.labels && test.labels.find(l => l.name === 'suite'))?.value || 'Other';
  if (!testsByFile[suite]) {
    testsByFile[suite] = [];
  }
  testsByFile[suite].push(test);
});

console.log('\n📊 Test Analysis:');
console.log(`   ✅ Passed: ${passed.length}`);
console.log(`   ❌ Failed: ${failed.length}`);
console.log(`   ⚠️  Broken: ${broken.length}`);
console.log(`   ⏭️  Skipped: ${skipped.length}`);
console.log(`   📝 Total: ${testResults.length}`);
console.log(`   ⏱️  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
console.log(`   📈 Pass Rate: ${passRate}%`);

// Create PDF
console.log('\n📄 Generating advanced PDF report...\n');

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 60, bottom: 60, left: 50, right: 50 },
  bufferPages: true,
  info: {
    Title: 'Test Execution Report',
    Author: 'QA Team',
    Subject: 'Automated Test Results',
    Keywords: 'testing, automation, playwright, quality assurance'
  }
});

const stream = fs.createWriteStream(OUTPUT_FILE);
doc.pipe(stream);

let pageNumber = 1;

// Helper: Add header
function addHeader(title = 'Test Execution Report') {
  doc.save();
  doc.fontSize(9)
     .fillColor(COLORS.primary)
     .font('Helvetica-Bold')
     .text(title, 50, 30, { width: 495, align: 'left' });

  doc.fontSize(8)
     .fillColor(COLORS.textLight)
     .font('Helvetica')
     .text(new Date().toLocaleDateString('en-US', {
       year: 'numeric',
       month: 'long',
       day: 'numeric'
     }), 50, 30, { width: 495, align: 'right' });

  doc.moveTo(50, 45).lineTo(545, 45).strokeColor(COLORS.border).stroke();
  doc.restore();
}

// Helper: Add footer
function addFooter() {
  doc.save();
  const y = 792 - 40;
  doc.moveTo(50, y).lineTo(545, y).strokeColor(COLORS.border).stroke();

  doc.fontSize(8)
     .fillColor(COLORS.textLight)
     .font('Helvetica')
     .text(`Page ${pageNumber}`, 50, y + 10, { width: 495, align: 'center' });

  pageNumber++;
  doc.restore();
}

// Helper: Draw progress bar
function drawProgressBar(x, y, width, percentage, color) {
  // Background
  doc.rect(x, y, width, 10)
     .fillAndStroke(COLORS.background, COLORS.border);

  // Progress
  const progressWidth = (width * percentage) / 100;
  doc.rect(x, y, progressWidth, 10)
     .fill(color);
}

// Helper: Draw metric card
function drawMetricCard(x, y, width, height, value, label, color) {
  doc.rect(x, y, width, height)
     .fillAndStroke('#FFFFFF', COLORS.border);

  doc.fontSize(32)
     .fillColor(color)
     .font('Helvetica-Bold')
     .text(value, x + 10, y + 15, { width: width - 20, align: 'center' });

  doc.fontSize(10)
     .fillColor(COLORS.textLight)
     .font('Helvetica')
     .text(label, x + 10, y + 60, { width: width - 20, align: 'center' });
}

// ==================== COVER PAGE ====================
doc.fontSize(36)
   .fillColor(COLORS.primary)
   .font('Helvetica-Bold')
   .text('Test Execution', 50, 150, { align: 'center' });

doc.fontSize(36)
   .text('Report', 50, 190, { align: 'center' });

doc.fontSize(14)
   .fillColor(COLORS.textLight)
   .font('Helvetica')
   .text('Quality Assurance & Test Automation', 50, 250, { align: 'center' });

// Company/Project info box
const boxY = 320;
doc.rect(150, boxY, 295, 120)
   .fillAndStroke(COLORS.background, COLORS.border);

doc.fontSize(11)
   .fillColor(COLORS.text)
   .font('Helvetica')
   .text('Project: Educatifu Web Application', 170, boxY + 20);

doc.text('Environment: Development', 170, boxY + 40);

doc.text('Test Suite: Playwright E2E Tests', 170, boxY + 60);

doc.text(`Execution Date: ${new Date().toLocaleDateString('en-US', { 
  weekday: 'long',
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})}`, 170, boxY + 80);

// Pass rate indicator at bottom
const passRateY = 500;
doc.fontSize(16)
   .fillColor(COLORS.text)  // Changed back to COLORS.text (black)
   .font('Helvetica-Bold')
   .text('Overall Pass Rate', 50, passRateY, { align: 'center' });

doc.fontSize(48)
   .fillColor(COLORS.success)  // Changed to always show in green instead of dynamic color
   .text(`${passRate}%`, 50, passRateY + 30, { align: 'center' });

addFooter();

// ==================== EXECUTIVE SUMMARY ====================
doc.addPage();
addHeader('Executive Summary');

doc.y = 80;

doc.fontSize(20)
   .fillColor(COLORS.primary)
   .font('Helvetica-Bold')
   .text('Executive Summary', 50, doc.y);

doc.moveDown(2);

// Key metrics cards
const cardY = doc.y;
const cardWidth = 110;
const cardHeight = 90;
const cardSpacing = 12;

drawMetricCard(50, cardY, cardWidth, cardHeight, testResults.length, 'Total Tests', COLORS.primary);
drawMetricCard(50 + cardWidth + cardSpacing, cardY, cardWidth, cardHeight, passed.length, 'Passed', COLORS.success);
drawMetricCard(50 + (cardWidth + cardSpacing) * 2, cardY, cardWidth, cardHeight, failed.length, 'Failed', COLORS.danger);
drawMetricCard(50 + (cardWidth + cardSpacing) * 3, cardY, cardWidth, cardHeight, broken.length, 'Broken', COLORS.warning);

doc.y = cardY + cardHeight + 30;

// Test execution timeline
doc.fontSize(14)
   .fillColor(COLORS.text)
   .font('Helvetica-Bold')
   .text('Test Results Breakdown', 50, doc.y);

doc.moveDown(1);

// Visual breakdown bar
const barY = doc.y;
const barWidth = 495;
const barHeight = 30;

const passWidth = (passed.length / testResults.length) * barWidth;
const failWidth = (failed.length / testResults.length) * barWidth;
const brokenWidth = (broken.length / testResults.length) * barWidth;
const skipWidth = (skipped.length / testResults.length) * barWidth;

let currentX = 50;

if (passWidth > 0) {
  doc.rect(currentX, barY, passWidth, barHeight).fill(COLORS.success);
  currentX += passWidth;
}
if (failWidth > 0) {
  doc.rect(currentX, barY, failWidth, barHeight).fill(COLORS.danger);
  currentX += failWidth;
}
if (brokenWidth > 0) {
  doc.rect(currentX, barY, brokenWidth, barHeight).fill(COLORS.warning);
  currentX += brokenWidth;
}
if (skipWidth > 0) {
  doc.rect(currentX, barY, skipWidth, barHeight).fill(COLORS.textLight);
}

doc.y = barY + barHeight + 20;

// Legend
const legendY = doc.y;
const legendItemWidth = 120;

doc.fontSize(10)
   .fillColor(COLORS.success)
   .font('Helvetica-Bold')
   .text(`● Passed (${passed.length})`, 50, legendY, { width: legendItemWidth });

doc.fillColor(COLORS.danger)
   .text(`● Failed (${failed.length})`, 170, legendY, { width: legendItemWidth });

doc.fillColor(COLORS.warning)
   .text(`● Broken (${broken.length})`, 290, legendY, { width: legendItemWidth });

doc.fillColor(COLORS.textLight)
   .text(`● Skipped (${skipped.length})`, 410, legendY, { width: legendItemWidth });

doc.y = legendY + 40;

// Performance metrics
doc.fontSize(14)
   .fillColor(COLORS.text)
   .font('Helvetica-Bold')
   .text('Performance Metrics', 50, doc.y);

doc.moveDown(1.5);

doc.fontSize(11)
   .fillColor(COLORS.text)
   .font('Helvetica');

const metricsStartY = doc.y;

doc.text('Total Execution Time:', 70, doc.y);
doc.font('Helvetica-Bold')
   .fillColor(COLORS.primary)
   .text(`${(totalDuration / 1000).toFixed(2)} seconds`, 220, doc.y);

doc.moveDown(0.8);
doc.font('Helvetica')
   .fillColor(COLORS.text)
   .text('Average Test Duration:', 70, doc.y);
doc.font('Helvetica-Bold')
   .fillColor(COLORS.primary)
   .text(`${(avgDuration / 1000).toFixed(2)} seconds`, 220, doc.y);

doc.moveDown(0.8);
doc.font('Helvetica')
   .fillColor(COLORS.text)
   .text('Screenshots Captured:', 70, doc.y);
doc.font('Helvetica-Bold')
   .fillColor(COLORS.primary)
   .text(`${screenshotFiles.length} images`, 220, doc.y);

doc.moveDown(0.8);
doc.font('Helvetica')
   .fillColor(COLORS.text)
   .text('Videos Recorded:', 70, doc.y);
doc.font('Helvetica-Bold')
   .fillColor(COLORS.primary)
   .text(`${videoFiles.length} videos`, 220, doc.y);

doc.y += 40;

// Test suites overview
doc.fontSize(14)
   .fillColor(COLORS.text)
   .font('Helvetica-Bold')
   .text('Test Suites Overview', 50, doc.y);

doc.moveDown(1);

const suiteNames = Object.keys(testsByFile);
let suiteY = doc.y;

suiteNames.forEach((suite, index) => {
  if (suiteY > 650) {
    addFooter();
    doc.addPage();
    addHeader('Executive Summary');
    suiteY = 80;
  }

  const suiteTests = testsByFile[suite];
  const suitePassed = suiteTests.filter(t => t.status === 'passed').length;
  const suitePassRate = ((suitePassed / suiteTests.length) * 100).toFixed(0);

  doc.fontSize(10)
     .fillColor(COLORS.text)
     .font('Helvetica')
     .text(suite, 70, suiteY, { width: 250 });

  doc.fillColor(COLORS.textLight)
     .text(`${suiteTests.length} tests`, 330, suiteY);

  // Mini progress bar
  const miniBarX = 400;
  const miniBarWidth = 100;
  drawProgressBar(miniBarX, suiteY - 2, miniBarWidth, suitePassRate,
    suitePassRate >= 90 ? COLORS.success : suitePassRate >= 70 ? COLORS.warning : COLORS.danger);

  doc.fillColor(COLORS.text)
     .font('Helvetica-Bold')
     .text(`${suitePassRate}%`, 510, suiteY);

  suiteY += 25;
});

addFooter();

// ==================== DETAILED TEST RESULTS ====================
doc.addPage();
addHeader('Detailed Test Results');

doc.y = 80;
doc.fontSize(20)
   .fillColor(COLORS.primary)
   .font('Helvetica-Bold')
   .text('Detailed Test Results', 50, doc.y);

doc.moveDown(2);

let testCounter = 0;

// Helper function to find screenshots recursively
function findAllScreenshots(test) {
  const screenshots = [];

  function searchSteps(obj) {
    if (!obj) return;

    if (obj.attachments && Array.isArray(obj.attachments)) {
      obj.attachments.forEach(att => {
        if (att.type && att.type.includes('image') && att.source) {
          screenshots.push(att.source);
        }
      });
    }

    if (obj.steps && Array.isArray(obj.steps)) {
      obj.steps.forEach(step => searchSteps(step));
    }
  }

  searchSteps(test);
  return screenshots;
}

// Add test function
function addTestDetails(test, statusColor, statusIcon, statusBg) {
  testCounter++;

  if (doc.y > 650) {
    addFooter();
    doc.addPage();
    addHeader('Detailed Test Results');
    doc.y = 80;
  }

  const testStartY = doc.y;

  // Test header box
  doc.rect(50, testStartY, 495, 40)
     .fillAndStroke(statusBg, COLORS.border);

  // Test number
  doc.fontSize(10)
     .fillColor(COLORS.textLight)
     .font('Helvetica')
     .text(`#${testCounter}`, 60, testStartY + 12);

  // Status icon
  doc.fontSize(14)
     .fillColor(statusColor)
     .font('Helvetica-Bold')
     .text(statusIcon, 90, testStartY + 10);

  // Test name
  doc.fontSize(11)
     .fillColor(COLORS.text)
     .font('Helvetica-Bold')
     .text(test.name || 'Unnamed Test', 110, testStartY + 12, { width: 380 });

  // Duration
  if (test.stop && test.start) {
    const duration = ((test.stop - test.start) / 1000).toFixed(2);
    doc.fontSize(9)
       .fillColor(COLORS.textLight)
       .font('Helvetica')
       .text(`${duration}s`, 500, testStartY + 13);
  }

  doc.y = testStartY + 50;

  // Error message
  if (test.statusDetails && test.statusDetails.message) {
    doc.fontSize(9)
       .fillColor(COLORS.danger)
       .font('Helvetica')
       .text(`Error: ${test.statusDetails.message.substring(0, 300)}`, 70, doc.y, {
         width: 460,
         lineGap: 3
       });
    doc.moveDown(0.5);
  }

  // Find and add screenshots
  const screenshots = findAllScreenshots(test);

  if (screenshots.length > 0) {
    console.log(`   📸 Adding ${screenshots.length} screenshot(s) for: ${test.name}`);

    screenshots.forEach((screenshotSource, index) => {
      const screenshotPath = path.join(RESULTS_DIR, screenshotSource);

      if (fs.existsSync(screenshotPath)) {
        try {
          if (doc.y > 500) {
            addFooter();
            doc.addPage();
            addHeader('Detailed Test Results');
            doc.y = 80;
          }

          doc.fontSize(9)
             .fillColor(COLORS.textLight)
             .font('Helvetica-Oblique')
             .text(`Screenshot ${index + 1}:`, 70, doc.y);

          doc.moveDown(0.5);

          const currentY = doc.y;
          const maxWidth = 460;
          const maxHeight = 280;

          doc.image(screenshotPath, 60, currentY, {
            fit: [maxWidth, maxHeight],
            align: 'center'
          });

          // Calculate actual height
          try {
            const img = doc.openImage(screenshotPath);
            const aspectRatio = img.height / img.width;
            const scaledWidth = Math.min(img.width, maxWidth);
            const actualHeight = Math.min(scaledWidth * aspectRatio, maxHeight);
            doc.y = currentY + actualHeight + 10;
          } catch (e) {
            doc.y = currentY + maxHeight + 10;
          }
        } catch (err) {
          console.error(`   ⚠️  Could not embed screenshot: ${screenshotSource}`);
        }
      }
    });
  }

  doc.moveDown(0.5);

  // Separator line
  doc.moveTo(50, doc.y)
     .lineTo(545, doc.y)
     .strokeColor(COLORS.border)
     .stroke();

  doc.moveDown(1);
}

// Add failed tests
if (failed.length > 0) {
  doc.fontSize(16)
     .fillColor(COLORS.danger)
     .font('Helvetica-Bold')
     .text('❌ Failed Tests', 50, doc.y);
  doc.moveDown(1);

  failed.forEach(test => addTestDetails(test, COLORS.danger, '✗', '#FEF2F2'));
}

// Add broken tests
if (broken.length > 0) {
  if (doc.y > 650) {
    addFooter();
    doc.addPage();
    addHeader('Detailed Test Results');
    doc.y = 80;
  }

  doc.fontSize(16)
     .fillColor(COLORS.warning)
     .font('Helvetica-Bold')
     .text('⚠️ Broken Tests', 50, doc.y);
  doc.moveDown(1);

  broken.forEach(test => addTestDetails(test, COLORS.warning, '⚠', '#FFFBEB'));
}

// Add passed tests
if (passed.length > 0) {
  if (doc.y > 650) {
    addFooter();
    doc.addPage();
    addHeader('Detailed Test Results');
    doc.y = 80;
  }

  doc.fontSize(16)
     .fillColor(COLORS.success)
     .font('Helvetica-Bold')
     .text('✅ Passed Tests', 50, doc.y);
  doc.moveDown(1);

  passed.forEach(test => addTestDetails(test, COLORS.success, '✓', '#F0FDF4'));
}

// Final footer
addFooter();

// Finalize PDF
doc.end();

stream.on('finish', () => {
  const stats = fs.statSync(OUTPUT_FILE);
  const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log('\n✅ Advanced Report Generated Successfully!');
  console.log('═══════════════════════════════════════════════════');
  console.log(`📁 Location: ${OUTPUT_FILE}`);
  console.log(`📦 Size: ${fileSizeInMB} MB`);
  console.log(`📄 Tests: ${testResults.length}`);
  console.log(`📸 Screenshots: ${screenshotFiles.length}`);
  console.log(`📊 Pass Rate: ${passRate}%`);
  console.log('═══════════════════════════════════════════════════');
  console.log('\n🎉 Advanced professional report ready for presentation!\n');
});

stream.on('error', (err) => {
  console.error('❌ Error writing PDF:', err);
  process.exit(1);
});
