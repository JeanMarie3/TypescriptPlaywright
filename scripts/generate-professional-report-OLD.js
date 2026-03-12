#!/usr/bin/env node

/**
 * Professional PDF Test Report Generator
 * Fully compliant with comprehensive PDF Report Requirements
 *
 * @author Playwright Automation Team
 * @version 2.0.0
 * @date December 7, 2025
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// ==================== CONFIGURATION ====================
const CONFIG = {
  MOCHAWESOME_JSON: path.join(__dirname, '../mochawesome-report/mochawesome.json'),
  PACKAGE_JSON: path.join(__dirname, '../package.json'),
  OUTPUT_DIR: path.join(__dirname, '../reports'),

  projectName: 'TypeScript Playwright Automation',
  applicationName: 'Educatifu Platform',
  testSuiteName: 'E2E Automated Test Suite',
  environment: process.env.TEST_ENV || 'Development',
  executionSource: process.env.CI ? 'CI Pipeline' : 'Local Workstation',

  showFullStackTrace: false,
  screenshotMode: 'inline',
  includeAllTests: true,
  groupBy: 'suite',

  excludeSensitiveData: true,
  addConfidentialityFooter: true,
  companyName: 'Educatifu',
  companyLogo: null
};

const COLORS = {
  primary: '#1976D2',
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  skipped: '#9E9E9E',
  blocked: '#FF6F00',
  broken: '#880E4F',
  lightGray: '#F5F5F5',
  darkGray: '#424242',
  mediumGray: '#757575',
  black: '#000000',
  white: '#FFFFFF',
  headerBg: '#263238',
  tableBorder: '#DDDDDD'
};

const timestamp = new Date();
const OUTPUT_FILE = path.join(
  CONFIG.OUTPUT_DIR,
  `test-report-${timestamp.toISOString().replace(/[:.]/g, '-').substring(0, 19)}.pdf`
);

console.log('🎯 Generating Professional PDF Test Report...\n');

// ==================== UTILITY FUNCTIONS ====================

function getGitInfo() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    const commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    return { branch, commit };
  } catch (err) {
    return { branch: 'N/A', commit: 'N/A' };
  }
}

function getAppVersion() {
  try {
    if (fs.existsSync(CONFIG.PACKAGE_JSON)) {
      const pkg = JSON.parse(fs.readFileSync(CONFIG.PACKAGE_JSON, 'utf8'));
      return pkg.version || '1.0.0';
    }
  } catch (err) {
    return '1.0.0';
  }
}

function getExecutorInfo() {
  const userInfo = os.userInfo();
  return {
    username: userInfo.username,
    fullName: process.env.USER_FULLNAME || userInfo.username,
    email: process.env.USER_EMAIL || `${userInfo.username}@company.com`,
    hostname: os.hostname(),
    platform: `${os.type()} ${os.release()}`
  };
}

function getPlaywrightVersion() {
  try {
    if (fs.existsSync(CONFIG.PACKAGE_JSON)) {
      const pkg = JSON.parse(fs.readFileSync(CONFIG.PACKAGE_JSON, 'utf8'));
      return pkg.devDependencies?.['@playwright/test'] || 'Unknown';
    }
  } catch (err) {
    return 'Unknown';
  }
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
}

function formatTimestamp(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch (err) {
    return dateStr;
  }
}

function getStatusColor(status) {
  const statusMap = {
    'passed': COLORS.success,
    'failed': COLORS.error,
    'skipped': COLORS.skipped,
    'blocked': COLORS.blocked,
    'broken': COLORS.broken
  };
  return statusMap[status?.toLowerCase()] || COLORS.mediumGray;
}

function getStatusIcon(status) {
  const iconMap = {
    'passed': '✓',
    'failed': '✗',
    'skipped': '⊘',
    'blocked': '⊗',
    'broken': '⊠'
  };
  return iconMap[status?.toLowerCase()] || '•';
}

function sanitizeText(text) {
  if (!CONFIG.excludeSensitiveData || !text) return text;

  let sanitized = text;
  sanitized = sanitized.replace(/password[=:]\s*\S+/gi, 'password=***');
  sanitized = sanitized.replace(/token[=:]\s*\S+/gi, 'token=***');
  sanitized = sanitized.replace(/api[_-]?key[=:]\s*\S+/gi, 'api_key=***');
  sanitized = sanitized.replace(/bearer\s+\S+/gi, 'bearer ***');

  return sanitized;
}

// ==================== DATA PARSING ====================

function parsePlaywrightReport() {
  if (!fs.existsSync(CONFIG.MOCHAWESOME_JSON)) {
    console.error('❌ Error: Test results not found!');
    console.error(`   Expected location: ${CONFIG.MOCHAWESOME_JSON}`);
    console.error('   Please run your tests first.');
    process.exit(1);
  }

  console.log(`📊 Reading test results...`);

  const allTests = [];
  let executionStart = null;
  let executionEnd = null;
  const stats = { screenshotsFound: 0 };

  try {
    const data = JSON.parse(fs.readFileSync(CONFIG.MOCHAWESOME_JSON, 'utf8'));

    if (data && data.suites) {
      extractTests(data.suites, allTests, '', stats);
    }

    allTests.forEach(test => {
      if (test.startTime) {
        const testStart = new Date(test.startTime);
        if (!executionStart || testStart < executionStart) {
          executionStart = testStart;
        }
      }
      if (test.endTime) {
        const testEnd = new Date(test.endTime);
        if (!executionEnd || testEnd > executionEnd) {
          executionEnd = testEnd;
        }
      }
    });

  } catch (err) {
    console.error(`❌ Parse error:`, err.message);
    process.exit(1);
  }

  console.log(`✓ Screenshots found: ${stats.screenshotsFound} of ${allTests.length} tests`);

  return {
    tests: allTests,
    executionStart: executionStart || timestamp,
    executionEnd: executionEnd || timestamp
  };
}

function extractTests(suites, allTests, parentTitle = '', stats = {}) {
  if (!suites) return;

  suites.forEach(suite => {
    const suiteTitle = parentTitle ? `${parentTitle} > ${suite.title}` : suite.title;

    if (suite.specs && suite.specs.length > 0) {
      suite.specs.forEach(spec => {
        if (spec.tests && spec.tests.length > 0) {
          spec.tests.forEach(test => {
            const result = test.results && test.results[0];
            if (result) {
              let screenshot = null;
              let videoPath = null;

              if (result.attachments) {
                const screenshotAtt = result.attachments.find(att =>
                  att.contentType && att.contentType.includes('image')
                );
                if (screenshotAtt && screenshotAtt.path) {
                  screenshot = screenshotAtt.path;
                  if (stats.screenshotsFound !== undefined) stats.screenshotsFound++;
                }

                const videoAtt = result.attachments.find(att =>
                  att.contentType && att.contentType.includes('video')
                );
                if (videoAtt && videoAtt.path) {
                  videoPath = videoAtt.path;
                }
              }

              let status = 'passed';
              let errorMessage = null;
              let stackTrace = null;

              if (result.status === 'failed' || result.status === 'timedOut') {
                status = 'failed';
                if (result.errors && result.errors.length > 0) {
                  errorMessage = sanitizeText(result.errors[0].message || '');
                  stackTrace = sanitizeText(result.errors[0].stack || '');
                }
              } else if (result.status === 'skipped') {
                status = 'skipped';
              } else if (result.status === 'interrupted') {
                status = 'broken';
              }

              const startTime = result.startTime ? new Date(result.startTime) : null;
              const endTime = startTime && result.duration ?
                new Date(startTime.getTime() + result.duration) : null;

              const testIdMatch = spec.title.match(/^(TC\d+):/);
              const testId = testIdMatch ? testIdMatch[1] : `TC${String(allTests.length + 1).padStart(4, '0')}`;
              const testTitle = spec.title.replace(/^TC\d+:\s*/, '');

              const tags = test.tags || [];
              const category = tags.length > 0 ? tags.join(', ') : 'Functional';


              allTests.push({
                id: testId,
                title: testTitle,
                fullTitle: spec.title,
                suite: suiteTitle,
                file: suite.file || '',
                status: status,
                duration: result.duration || 0,
                startTime: result.startTime,
                endTime: endTime ? endTime.toISOString() : null,
                error: errorMessage,
                stackTrace: stackTrace,
                screenshot: screenshot,
                videoPath: videoPath,
                browser: test.projectName || 'chromium',
                category: category,
                tags: tags,
                retry: result.retry || 0
              });
            }
          });
        }
      });
    }

    if (suite.suites && suite.suites.length > 0) {
      extractTests(suite.suites, allTests, suiteTitle, stats);
    }
  });
}

// ==================== PDF GENERATION FUNCTIONS ====================

// Calculate estimated height needed for a test
function calculateTestHeight(test) {
  let height = 0;
  height += 20; // Test number
  height += 30; // Title (reduced from 35)
  height += 18; // Suite/category line (reduced from 20)
  height += 30; // Status badge and metadata (reduced from 35)

  if (test.error && test.status === 'failed') {
    height += 60; // Error section (reduced from 75)
  }

  height += 28; // Separator and screenshot header (reduced from 30)

  // Screenshot or placeholder
  if (test.screenshot && fs.existsSync(test.screenshot)) {
    height += 190; // Reduced from 250 to 190 for tighter packing
  } else {
    height += 65; // Placeholder height (reduced from 80)
  }

  height += 15; // Caption/spacing (reduced from 20)

  return height;
}

// Generate test detail with DYNAMIC page breaking (adds pages as needed during render)
function generateTestDetailPageFlowDynamic(doc, test, index, total, startY) {
  let currentY = startY;
  const pageBottom = doc.page.height - 70; // Leave 70px for footer

  // Helper to check and add page if needed
  const checkPageBreak = (neededHeight) => {
    if (currentY + neededHeight > pageBottom) {
      doc.addPage();
      currentY = 50;
      return true;
    }
    return false;
  };

  // Test number - ULTRA compact
  checkPageBreak(12);
  doc.fontSize(7).fillColor(COLORS.mediumGray).font('Helvetica')
     .text(`Test ${index}/${total}`, 50, currentY);
  currentY += 11;

  // Title - compact
  checkPageBreak(20);
  doc.fontSize(9).fillColor(COLORS.primary).font('Helvetica-Bold')
     .text(`${test.id}: ${test.title}`, 50, currentY, { width: doc.page.width - 100 });
  currentY += 19;

  // Suite - very compact
  checkPageBreak(12);
  doc.fontSize(6).fillColor(COLORS.mediumGray).font('Helvetica')
     .text(`${test.suite} | ${test.category}`, 50, currentY, { width: doc.page.width - 100 });
  currentY += 11;

  // Status badge - smaller
  checkPageBreak(20);
  const statusColor = getStatusColor(test.status);
  doc.roundedRect(50, currentY, 65, 18, 3).fill(statusColor);
  doc.fontSize(8).fillColor(COLORS.white).font('Helvetica-Bold')
     .text(`${getStatusIcon(test.status)} ${test.status.toUpperCase()}`, 50, currentY + 4, { width: 65, align: 'center' });

  // Metadata next to badge - ultra compact
  doc.fontSize(6).fillColor(COLORS.black).font('Helvetica')
     .text(`⏱${formatDuration(test.duration)} 🌐${test.browser}`, 125, currentY + 6);
  currentY += 22;

  // Error if failed - minimal
  if (test.error && test.status === 'failed') {
    checkPageBreak(40);
    doc.fontSize(7).fillColor(COLORS.error).font('Helvetica-Bold')
       .text('Error:', 50, currentY);
    currentY += 9;

    const errorText = test.error.substring(0, 200);
    doc.fontSize(5).fillColor(COLORS.black).font('Helvetica')
       .text(errorText, 50, currentY, { width: doc.page.width - 100, height: 28 });
    currentY += 34;
  }

  // Separator - thin
  checkPageBreak(4);
  doc.moveTo(50, currentY).lineTo(doc.page.width - 50, currentY)
     .strokeColor(COLORS.tableBorder).lineWidth(0.3).stroke();
  currentY += 4;

  // Screenshot header - minimal
  checkPageBreak(11);
  doc.fontSize(7).fillColor(COLORS.primary).font('Helvetica-Bold')
     .text('Screenshot', 50, currentY);
  currentY += 11;

  // Screenshot - ULTRA COMPACT (thumbnail size)
  if (test.screenshot && fs.existsSync(test.screenshot)) {
    try {
      const maxWidth = doc.page.width - 100;
      const availableSpace = pageBottom - currentY - 15;

      // MUCH smaller screenshots - thumbnail size only!
      const maxHeight = Math.min(availableSpace, 120); // Reduced from 200 to 120!

      // If we have less than 60px, move to next page
      if (maxHeight < 60) {
        doc.addPage();
        currentY = 50;
      }

      const actualMaxHeight = Math.min(pageBottom - currentY - 15, 120);

      doc.rect(49, currentY - 1, maxWidth + 2, actualMaxHeight + 2)
         .strokeColor(COLORS.tableBorder).lineWidth(0.5).stroke();

      doc.image(test.screenshot, 50, currentY, {
        fit: [maxWidth, actualMaxHeight],
        align: 'center',
        valign: 'top'
      });

      currentY += actualMaxHeight + 3;

      // Caption
      checkPageBreak(8);
      doc.fontSize(5).fillColor(COLORS.mediumGray).font('Helvetica-Oblique')
         .text(`Captured: ${formatTimestamp(test.endTime || test.startTime).split(' ')[1]}`,
                50, currentY, { width: doc.page.width - 100, align: 'center' });
      currentY += 8;

    } catch (err) {
      console.error(`Screenshot error for ${test.id}: ${err.message}`);
      doc.fontSize(7).fillColor(COLORS.warning).font('Helvetica-Oblique')
         .text('⚠ Screenshot unavailable', 50, currentY);
      currentY += 12;
    }
  } else {
    // No screenshot - minimal placeholder
    checkPageBreak(40);
    doc.rect(50, currentY, doc.page.width - 100, 35)
       .fillAndStroke(COLORS.lightGray, COLORS.tableBorder);
    doc.fontSize(7).fillColor(COLORS.mediumGray).font('Helvetica-Bold')
       .text('No Screenshot', 50, currentY + 14, { width: doc.page.width - 100, align: 'center' });
    currentY += 40;
  }

  // Video link
  if (test.videoPath) {
    checkPageBreak(8);
    doc.fontSize(5).fillColor(COLORS.primary).font('Helvetica')
       .text(`📹 ${path.basename(test.videoPath)}`, 50, currentY);
    currentY += 8;
  }

  return currentY;
}

// Generate test detail in continuous flow (returns new Y position)
function generateTestDetailPageFlow(doc, test, index, total, startY) {
  let currentY = startY;

  // Test number indicator
  doc.fontSize(8)
     .fillColor(COLORS.mediumGray)
     .font('Helvetica')
     .text(`Test ${index}/${total}`, 50, currentY);
  currentY += 16;

  // Test ID and Title - compact
  doc.fontSize(11)
     .fillColor(COLORS.primary)
     .font('Helvetica-Bold')
     .text(`${test.id}: ${test.title}`, 50, currentY, { width: doc.page.width - 100 });
  currentY += 28;

  // Suite and Category - one line, smaller font
  doc.fontSize(7)
     .fillColor(COLORS.mediumGray)
     .font('Helvetica')
     .text(`${test.suite} | ${test.category}`, 50, currentY, {
       width: doc.page.width - 100
     });
  currentY += 16;

  // Status badge and metadata in same row - smaller
  const statusColor = getStatusColor(test.status);

  doc.roundedRect(50, currentY, 80, 22, 4).fill(statusColor);
  doc.fontSize(10)
     .fillColor(COLORS.white)
     .font('Helvetica-Bold')
     .text(`${getStatusIcon(test.status)} ${test.status.toUpperCase()}`, 50, currentY + 5, {
       width: 80,
       align: 'center'
     });

  // Compact metadata next to status badge
  const metaX = 140;
  doc.fontSize(7)
     .fillColor(COLORS.black)
     .font('Helvetica')
     .text(`⏱ ${formatDuration(test.duration)} | 🌐 ${test.browser.toUpperCase()} | ⏰ ${formatTimestamp(test.startTime).split(' ')[1]}`, metaX, currentY + 8);

  currentY += 28;

  // Error message if failed - very compact
  if (test.error && test.status === 'failed') {
    doc.fontSize(8)
       .fillColor(COLORS.error)
       .font('Helvetica-Bold')
       .text('Error:', 50, currentY);
    currentY += 12;

    const errorText = CONFIG.showFullStackTrace && test.stackTrace ? test.stackTrace : test.error;
    doc.fontSize(6)
       .fillColor(COLORS.black)
       .font('Helvetica')
       .text(errorText.substring(0, 300), 50, currentY, {
         width: doc.page.width - 100,
         height: 40
       });
    currentY += 48;
  }

  // Thin separator line
  doc.moveTo(50, currentY)
     .lineTo(doc.page.width - 50, currentY)
     .strokeColor(COLORS.tableBorder)
     .lineWidth(0.5)
     .stroke();
  currentY += 6;

  // Screenshot Section - compact header
  doc.fontSize(9)
     .fillColor(COLORS.primary)
     .font('Helvetica-Bold')
     .text('Screenshot', 50, currentY);
  currentY += 16;

  // Screenshot - much smaller for better packing
  if (test.screenshot && fs.existsSync(test.screenshot)) {
    try {
      const maxWidth = doc.page.width - 100;
      const availableHeight = doc.page.height - currentY - 70;
      const maxHeight = Math.min(availableHeight, 180); // Reduced from 240 to 180

      // Thin border around screenshot
      doc.rect(49, currentY - 1, maxWidth + 2, maxHeight + 2)
         .strokeColor(COLORS.tableBorder)
         .lineWidth(0.5)
         .stroke();

      doc.image(test.screenshot, 50, currentY, {
        fit: [maxWidth, maxHeight],
        align: 'center',
        valign: 'top'
      });

      currentY += maxHeight + 4;

      // Compact caption
      doc.fontSize(6)
         .fillColor(COLORS.mediumGray)
         .font('Helvetica-Oblique')
         .text(
           `Captured: ${formatTimestamp(test.endTime || test.startTime).split(' ')[1]}`,
           50,
           currentY,
           { width: doc.page.width - 100, align: 'center' }
         );

      currentY += 10;

    } catch (err) {
      console.error(`   ✗ Screenshot error for ${test.id}: ${err.message}`);
      doc.fontSize(7)
         .fillColor(COLORS.warning)
         .font('Helvetica-Oblique')
         .text('⚠ Screenshot unavailable', 50, currentY);

      currentY += 15;
    }
  } else {
    // No screenshot - very compact placeholder
    const noScreenshotBox = {
      x: 50,
      y: currentY,
      width: doc.page.width - 100,
      height: 50
    };

    doc.rect(noScreenshotBox.x, noScreenshotBox.y, noScreenshotBox.width, noScreenshotBox.height)
       .fillAndStroke(COLORS.lightGray, COLORS.tableBorder);

    doc.fontSize(8)
       .fillColor(COLORS.mediumGray)
       .font('Helvetica-Bold')
       .text('No Screenshot',
         noScreenshotBox.x,
         noScreenshotBox.y + 20,
         { width: noScreenshotBox.width, align: 'center' }
       );

    currentY += 55;
  }

  // Video link if available - very compact
  if (test.videoPath) {
    doc.fontSize(5)
       .fillColor(COLORS.primary)
       .font('Helvetica')
       .text(`📹 ${path.basename(test.videoPath)}`, 50, currentY);
    currentY += 8;
  }

  return currentY;
}

function generateCoverPage(doc, stats) {
  const executor = stats.executor;

  // Background gradient
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.primary);

  // Title section
  doc.fontSize(48)
     .fillColor(COLORS.white)
     .font('Helvetica-Bold')
     .text('TEST REPORT', 50, 150, { align: 'center' });

  doc.fontSize(24)
     .font('Helvetica')
     .text(CONFIG.projectName, 50, 220, { align: 'center' });

  doc.fontSize(18)
     .text(CONFIG.testSuiteName, 50, 260, { align: 'center' });

  // Status box
  const statusY = 330;
  const statusColor = stats.overallStatus === 'PASSED' ? COLORS.success : COLORS.error;

  doc.roundedRect(doc.page.width / 2 - 100, statusY, 200, 60, 10)
     .fillAndStroke(statusColor, COLORS.white);

  doc.fontSize(32)
     .fillColor(COLORS.white)
     .font('Helvetica-Bold')
     .text(stats.overallStatus, doc.page.width / 2 - 100, statusY + 15, {
       width: 200,
       align: 'center'
     });

  // Statistics
  doc.fontSize(14)
     .font('Helvetica')
     .fillColor(COLORS.white)
     .text(`Total Tests: ${stats.totalTests}`, 50, 430, { align: 'center' })
     .text(`✓ Passed: ${stats.passed}  |  ✗ Failed: ${stats.failed}  |  ⊘ Skipped: ${stats.skipped}`, 50, 460, { align: 'center' })
     .text(`Duration: ${formatDuration(stats.totalDuration)}`, 50, 490, { align: 'center' });

  // Metadata box
  const metaY = 550;
  doc.fontSize(12)
     .text(`Executed by: ${executor.fullName} (${executor.username})`, 50, metaY, { align: 'center' })
     .text(`Email: ${executor.email}`, 50, metaY + 25, { align: 'center' })
     .text(`Hostname: ${executor.hostname}`, 50, metaY + 50, { align: 'center' })
     .text(`Platform: ${executor.platform}`, 50, metaY + 75, { align: 'center' })
     .text(`Environment: ${CONFIG.environment}`, 50, metaY + 100, { align: 'center' })
     .text(`Source: ${CONFIG.executionSource}`, 50, metaY + 125, { align: 'center' })
     .text(`Generated: ${formatTimestamp(timestamp)}`, 50, metaY + 150, { align: 'center' });

  // Confidentiality footer
  if (CONFIG.addConfidentialityFooter) {
    doc.fontSize(8)
       .fillColor(COLORS.lightGray)
       .text('CONFIDENTIAL - For Internal Use Only', 50, doc.page.height - 50, { align: 'center' });
  }
}

function generateSummaryPage(doc, stats) {
  doc.fontSize(24)
     .fillColor(COLORS.primary)
     .font('Helvetica-Bold')
     .text('Executive Summary', 50, 50);

  doc.moveDown(1);

  // Summary table
  const tableTop = 120;
  const tableLeft = 50;
  const colWidth = (doc.page.width - 100) / 2;

  // Table header
  doc.rect(tableLeft, tableTop, colWidth * 2, 30).fill(COLORS.headerBg);
  doc.fontSize(12)
     .fillColor(COLORS.white)
     .font('Helvetica-Bold')
     .text('Metric', tableLeft + 10, tableTop + 10, { width: colWidth - 20 })
     .text('Value', tableLeft + colWidth + 10, tableTop + 10, { width: colWidth - 20 });

  let rowY = tableTop + 30;
  const rowHeight = 25;

  const summaryData = [
    ['Project Name', CONFIG.projectName],
    ['Application', CONFIG.applicationName],
    ['Test Suite', CONFIG.testSuiteName],
    ['Environment', CONFIG.environment],
    ['Execution Source', CONFIG.executionSource],
    ['Executor', `${stats.executor.fullName} (${stats.executor.username})`],
    ['Start Time', formatTimestamp(stats.executionStart)],
    ['End Time', formatTimestamp(stats.executionEnd)],
    ['Total Duration', formatDuration(stats.totalDuration)],
    ['Total Test Cases', stats.totalTests],
    ['Passed', `${stats.passed} (${stats.totalTests > 0 ? ((stats.passed / stats.totalTests) * 100).toFixed(1) : 0}%)`],
    ['Failed', `${stats.failed} (${stats.totalTests > 0 ? ((stats.failed / stats.totalTests) * 100).toFixed(1) : 0}%)`],
    ['Skipped', `${stats.skipped} (${stats.totalTests > 0 ? ((stats.skipped / stats.totalTests) * 100).toFixed(1) : 0}%)`],
    ['Blocked', stats.blocked],
    ['Broken', stats.broken],
    ['Overall Status', stats.overallStatus],
    ['Application Version', stats.appVersion],
    ['Git Branch', stats.gitInfo.branch],
    ['Git Commit', stats.gitInfo.commit],
    ['Playwright Version', stats.playwrightVersion]
  ];

  summaryData.forEach((row, index) => {
    const bgColor = index % 2 === 0 ? COLORS.lightGray : COLORS.white;
    doc.rect(tableLeft, rowY, colWidth * 2, rowHeight).fill(bgColor);

    doc.fontSize(10)
       .fillColor(COLORS.black)
       .font('Helvetica')
       .text(row[0], tableLeft + 10, rowY + 7, { width: colWidth - 20 })
       .font('Helvetica-Bold')
       .text(String(row[1]), tableLeft + colWidth + 10, rowY + 7, { width: colWidth - 20 });

    rowY += rowHeight;
  });

  // Simple chart representation using text
  const chartY = rowY + 30;
  doc.fontSize(14)
     .fillColor(COLORS.primary)
     .font('Helvetica-Bold')
     .text('Test Status Distribution', 50, chartY);

  const chartBarY = chartY + 30;
  const barHeight = 20;
  const maxBarWidth = doc.page.width - 200;

  if (stats.totalTests > 0) {
    // Passed bar
    const passedWidth = (stats.passed / stats.totalTests) * maxBarWidth;
    doc.rect(50, chartBarY, passedWidth, barHeight).fill(COLORS.success);
    doc.fontSize(10)
       .fillColor(COLORS.white)
       .text(`${stats.passed}`, 55, chartBarY + 5);

    // Failed bar
    const failedWidth = (stats.failed / stats.totalTests) * maxBarWidth;
    doc.rect(50, chartBarY + 30, failedWidth, barHeight).fill(COLORS.error);
    doc.fontSize(10)
       .fillColor(COLORS.white)
       .text(`${stats.failed}`, 55, chartBarY + 35);

    // Skipped bar
    const skippedWidth = (stats.skipped / stats.totalTests) * maxBarWidth;
    doc.rect(50, chartBarY + 60, skippedWidth, barHeight).fill(COLORS.skipped);
    doc.fontSize(10)
       .fillColor(COLORS.white)
       .text(`${stats.skipped}`, 55, chartBarY + 65);

    // Legend
    doc.fontSize(9)
       .fillColor(COLORS.black)
       .font('Helvetica')
       .text(`Passed (${((stats.passed / stats.totalTests) * 100).toFixed(1)}%)`, 60 + passedWidth, chartBarY + 5)
       .text(`Failed (${((stats.failed / stats.totalTests) * 100).toFixed(1)}%)`, 60 + failedWidth, chartBarY + 35)
       .text(`Skipped (${((stats.skipped / stats.totalTests) * 100).toFixed(1)}%)`, 60 + skippedWidth, chartBarY + 65);
  }
}

function generateTestDetailsTable(doc, groupedTests) {
  doc.fontSize(24)
     .fillColor(COLORS.primary)
     .font('Helvetica-Bold')
     .text('Test Cases Summary', 50, 50);

  let currentY = 100;

  Object.keys(groupedTests).forEach(groupName => {
    const tests = groupedTests[groupName];

    // Group header
    if (groupName !== 'All Tests') {
      doc.fontSize(14)
         .fillColor(COLORS.darkGray)
         .font('Helvetica-Bold')
         .text(groupName, 50, currentY);
      currentY += 25;
    }

    // Table header
    const tableLeft = 50;
    const colWidths = [60, 180, 70, 80, 80, 45];
    const tableWidth = colWidths.reduce((a, b) => a + b, 0);

    doc.rect(tableLeft, currentY, tableWidth, 25).fill(COLORS.headerBg);

    doc.fontSize(9)
       .fillColor(COLORS.white)
       .font('Helvetica-Bold');

    let xPos = tableLeft;
    ['ID', 'Title', 'Status', 'Duration', 'Browser', 'Retry'].forEach((header, i) => {
      doc.text(header, xPos + 5, currentY + 8, { width: colWidths[i] - 10 });
      xPos += colWidths[i];
    });

    currentY += 25;

    // Table rows
    tests.forEach((test, index) => {
      // Check if we need a new page
      if (currentY > doc.page.height - 100) {
        doc.addPage();
        currentY = 50;
      }

      const bgColor = index % 2 === 0 ? COLORS.lightGray : COLORS.white;
      doc.rect(tableLeft, currentY, tableWidth, 20).fill(bgColor);

      doc.fontSize(8)
         .fillColor(COLORS.black)
         .font('Helvetica');

      xPos = tableLeft;
      const rowData = [
        test.id,
        test.title.substring(0, 40) + (test.title.length > 40 ? '...' : ''),
        test.status.toUpperCase(),
        formatDuration(test.duration),
        test.browser,
        test.retry
      ];

      rowData.forEach((data, i) => {
        if (i === 2) { // Status column - add color
          doc.fillColor(getStatusColor(test.status))
             .font('Helvetica-Bold')
             .text(getStatusIcon(test.status) + ' ' + data, xPos + 5, currentY + 5, { width: colWidths[i] - 10 })
             .fillColor(COLORS.black)
             .font('Helvetica');
        } else {
          doc.text(String(data), xPos + 5, currentY + 5, { width: colWidths[i] - 10 });
        }
        xPos += colWidths[i];
      });

      currentY += 20;
    });

    currentY += 30;
  });
}

function generateTestDetailPage(doc, test, index, total) {
  // Start at top of page
  let currentY = 50;

  // Test number indicator
  doc.fontSize(9)
     .fillColor(COLORS.mediumGray)
     .font('Helvetica')
     .text(`Test Case ${index} of ${total}`, 50, currentY);
  currentY += 20;

  // Test ID and Title - more compact
  doc.fontSize(12)
     .fillColor(COLORS.primary)
     .font('Helvetica-Bold')
     .text(`${test.id}: ${test.title}`, 50, currentY, { width: doc.page.width - 100 });
  currentY += 35;

  // Suite and Category - one line
  doc.fontSize(8)
     .fillColor(COLORS.mediumGray)
     .font('Helvetica')
     .text(`Suite: ${test.suite} | Category: ${test.category} | File: ${test.file}`, 50, currentY, {
       width: doc.page.width - 100
     });
  currentY += 20;

  // Status badge and metadata in same row
  const statusColor = getStatusColor(test.status);

  doc.roundedRect(50, currentY, 90, 25, 5).fill(statusColor);
  doc.fontSize(11)
     .fillColor(COLORS.white)
     .font('Helvetica-Bold')
     .text(`${getStatusIcon(test.status)} ${test.status.toUpperCase()}`, 50, currentY + 6, {
       width: 90,
       align: 'center'
     });

  // Compact metadata next to status badge
  const metaX = 150;
  doc.fontSize(8)
     .fillColor(COLORS.black)
     .font('Helvetica')
     .text(`Duration: ${formatDuration(test.duration)} | Browser: ${test.browser.toUpperCase()}`, metaX, currentY + 2)
     .text(`Started: ${formatTimestamp(test.startTime)}`, metaX, currentY + 13);

  currentY += 35;

  // Error message if failed - more compact
  if (test.error && test.status === 'failed') {
    doc.fontSize(9)
       .fillColor(COLORS.error)
       .font('Helvetica-Bold')
       .text('Failure Reason:', 50, currentY);
    currentY += 15;

    const errorText = CONFIG.showFullStackTrace && test.stackTrace ? test.stackTrace : test.error;
    doc.fontSize(7)
       .fillColor(COLORS.black)
       .font('Helvetica')
       .text(errorText.substring(0, 350), 50, currentY, {
         width: doc.page.width - 100,
         height: 50
       });
    currentY += 60;
  }

  // Add separator line before screenshot section
  doc.moveTo(50, currentY)
     .lineTo(doc.page.width - 50, currentY)
     .strokeColor(COLORS.tableBorder)
     .stroke();
  currentY += 8;

  // Screenshot Section - Always at the end
  doc.fontSize(10)
     .fillColor(COLORS.primary)
     .font('Helvetica-Bold')
     .text('Test Evidence - Screenshot', 50, currentY);
  currentY += 20;

  // Screenshot (always shown if available, placed at the end)
  if (test.screenshot && fs.existsSync(test.screenshot)) {
    try {
      const maxWidth = doc.page.width - 100;
      const availableHeight = doc.page.height - currentY - 80; // Leave space for footer
      const maxHeight = Math.min(availableHeight, 480); // Cap max height to prevent huge images

      // Add border around screenshot
      doc.rect(48, currentY - 2, maxWidth + 4, maxHeight + 4)
         .strokeColor(COLORS.tableBorder)
         .lineWidth(1)
         .stroke();

      doc.image(test.screenshot, 50, currentY, {
        fit: [maxWidth, maxHeight],
        align: 'center',
        valign: 'top'
      });

      // Add caption below
      const captionY = currentY + maxHeight + 8;
      doc.fontSize(7)
         .fillColor(COLORS.mediumGray)
         .font('Helvetica-Oblique')
         .text(
           `Screenshot captured at: ${formatTimestamp(test.endTime || test.startTime)}`,
           50,
           captionY,
           { width: doc.page.width - 100, align: 'center' }
         );

    } catch (err) {
      console.error(`   ✗ Screenshot error for ${test.id}: ${err.message}`);
      doc.fontSize(8)
         .fillColor(COLORS.warning)
         .font('Helvetica-Oblique')
         .text('⚠ Screenshot file not accessible or corrupted', 50, currentY);

      doc.fontSize(7)
         .fillColor(COLORS.mediumGray)
         .text(`Error: ${err.message}`, 50, currentY + 15, { width: doc.page.width - 100 });
    }
  } else {
    // No screenshot available - compact placeholder
    const noScreenshotBox = {
      x: 50,
      y: currentY,
      width: doc.page.width - 100,
      height: 80
    };

    doc.rect(noScreenshotBox.x, noScreenshotBox.y, noScreenshotBox.width, noScreenshotBox.height)
       .fillAndStroke(COLORS.lightGray, COLORS.tableBorder);

    doc.fontSize(9)
       .fillColor(COLORS.mediumGray)
       .font('Helvetica-Bold')
       .text('No Screenshot Available',
         noScreenshotBox.x,
         noScreenshotBox.y + 25,
         { width: noScreenshotBox.width, align: 'center' }
       );

    doc.fontSize(7)
       .font('Helvetica-Oblique')
       .text('Screenshot was not captured during test execution',
         noScreenshotBox.x,
         noScreenshotBox.y + 42,
         { width: noScreenshotBox.width, align: 'center' }
       );
  }

  // Video link if available (bottom of page)
  if (test.videoPath) {
    doc.fontSize(6)
       .fillColor(COLORS.primary)
       .font('Helvetica')
       .text(`📹 Video: ${path.basename(test.videoPath)}`, 50, doc.page.height - 45, {
         width: doc.page.width - 100,
         align: 'left'
       });
  }
}

function addPageNumbers(doc) {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);

    // Page number
    doc.fontSize(8)
       .fillColor(COLORS.mediumGray)
       .font('Helvetica')
       .text(
         `Page ${i + 1} of ${range.count}`,
         50,
         doc.page.height - 30,
         { align: 'center' }
       );

    // Confidentiality footer
    if (CONFIG.addConfidentialityFooter && i > 0) {
      doc.fontSize(7)
         .fillColor(COLORS.mediumGray)
         .text(`${CONFIG.companyName} - Confidential`, 50, doc.page.height - 20, { align: 'center' });
    }
  }
}

function createPDF(reportData) {
  const { tests, executionStart, executionEnd } = reportData;

  let filteredTests = CONFIG.includeAllTests ? tests : tests.filter(t => t.status === 'failed');

  let groupedTests = {};
  if (CONFIG.groupBy === 'suite') {
    filteredTests.forEach(test => {
      if (!groupedTests[test.suite]) groupedTests[test.suite] = [];
      groupedTests[test.suite].push(test);
    });
  } else if (CONFIG.groupBy === 'status') {
    filteredTests.forEach(test => {
      if (!groupedTests[test.status]) groupedTests[test.status] = [];
      groupedTests[test.status].push(test);
    });
  } else {
    groupedTests['All Tests'] = filteredTests;
  }

  if (!fs.existsSync(CONFIG.OUTPUT_DIR)) {
    fs.mkdirSync(CONFIG.OUTPUT_DIR, { recursive: true });
  }

  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    bufferPages: true,
    info: {
      Title: `${CONFIG.projectName} - Test Report`,
      Author: getExecutorInfo().fullName,
      Subject: 'Automated Test Execution Report',
      Keywords: 'playwright, testing, automation, report, QA'
    }
  });

  const stream = fs.createWriteStream(OUTPUT_FILE);
  doc.pipe(stream);

  const executor = getExecutorInfo();
  const gitInfo = getGitInfo();
  const appVersion = getAppVersion();
  const playwrightVersion = getPlaywrightVersion();

  const totalTests = tests.length;
  const passed = tests.filter(t => t.status === 'passed').length;
  const failed = tests.filter(t => t.status === 'failed').length;
  const skipped = tests.filter(t => t.status === 'skipped').length;
  const blocked = tests.filter(t => t.status === 'blocked').length;
  const broken = tests.filter(t => t.status === 'broken').length;
  const totalDuration = tests.reduce((sum, t) => sum + t.duration, 0);
  const overallStatus = failed > 0 || broken > 0 ? 'FAILED' : (passed > 0 ? 'PASSED' : 'NO RESULTS');

  const stats = {
    executor,
    executionStart,
    executionEnd,
    totalTests,
    passed,
    failed,
    skipped,
    blocked,
    broken,
    overallStatus,
    totalDuration,
    appVersion,
    gitInfo,
    playwrightVersion
  };

  // Generate pages
  generateCoverPage(doc, stats);
  doc.addPage();
  generateSummaryPage(doc, stats);
  doc.addPage();
  generateTestDetailsTable(doc, groupedTests);

  // Generate individual test pages with TRUE continuous flow
  doc.addPage();
  let currentY = 50;
  let testCounter = 0;

  Object.keys(groupedTests).forEach(groupName => {
    groupedTests[groupName].forEach((test, index) => {
      testCounter++;

      // Only check if we have minimum space to start a test (100px)
      if (currentY > doc.page.height - 100) {
        doc.addPage();
        currentY = 50;
      }

      // Generate test with dynamic page breaking
      currentY = generateTestDetailPageFlowDynamic(doc, test, testCounter, filteredTests.length, currentY);

      // Minimal spacing between tests
      currentY += 12;
    });
  });

  addPageNumbers(doc);
  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => {
      console.log('✅ PDF generated successfully!');
      console.log(`📁 Location: ${OUTPUT_FILE}`);

      const stats = fs.statSync(OUTPUT_FILE);
      const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`📦 Size: ${fileSizeInMB} MB\n`);

      resolve(OUTPUT_FILE);
    });
    stream.on('error', reject);
  });
}

// ==================== MAIN EXECUTION ====================

(async () => {
  try {
    console.log('📊 Parsing test results...');
    const reportData = parsePlaywrightReport();

    console.log(`✅ Found ${reportData.tests.length} test cases`);
    console.log(`   • Passed: ${reportData.tests.filter(t => t.status === 'passed').length}`);
    console.log(`   • Failed: ${reportData.tests.filter(t => t.status === 'failed').length}`);
    console.log(`   • Skipped: ${reportData.tests.filter(t => t.status === 'skipped').length}\n`);

    console.log('📝 Generating PDF report...');
    await createPDF(reportData);

    console.log('🎉 Professional Test Report generated successfully!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();

