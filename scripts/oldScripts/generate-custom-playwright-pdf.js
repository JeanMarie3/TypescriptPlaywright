#!/usr/bin/env node

/**
 * Generate Professional PDF Test Report from Playwright Test Results
 * Complies with comprehensive functional and layout requirements
 *
 * Features:
 * - Cover page with project info, executor details, and test metadata
 * - Executive summary with status distribution charts
 * - Detailed test case table with all required fields
 * - One screenshot per test case (embedded or appendix)
 * - Traceability (version, git commit, build info)
 * - Configurable options for filtering and grouping
 * - Security and compliance features
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// ==================== CONFIGURATION ====================
const CONFIG = {
  // Paths
  MOCHAWESOME_JSON: path.join(__dirname, '../mochawesome-report/mochawesome.json'),
  PACKAGE_JSON: path.join(__dirname, '../package.json'),
  OUTPUT_DIR: path.join(__dirname, '../reports'),

  // Report Options
  projectName: 'TypeScript Playwright Automation',
  applicationName: 'Educatifu Platform',
  testSuiteName: 'E2E Test Suite',
  environment: process.env.TEST_ENV || 'Development',
  executionSource: process.env.CI ? 'CI Pipeline' : 'Local',

  // Display Options
  showFullStackTrace: false,
  screenshotMode: 'inline', // 'inline' or 'appendix'
  includeAllTests: true, // false = failed tests only
  groupBy: 'suite', // 'suite', 'status', 'none'

  // Security
  excludeSensitiveData: true,
  addConfidentialityFooter: true,
  companyLogo: null // path to logo if available
};

// Colors and Styles
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

console.log('🎯 Generating Professional Test Report PDF...\n');

// ==================== UTILITY FUNCTIONS ====================

// Get Git information for traceability
function getGitInfo() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    const commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    const commitFull = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    return { branch, commit, commitFull };
  } catch (err) {
    return { branch: 'N/A', commit: 'N/A', commitFull: 'N/A' };
  }
}

// Get application version from package.json
function getAppVersion() {
  try {
    if (fs.existsSync(CONFIG.PACKAGE_JSON)) {
      const pkg = JSON.parse(fs.readFileSync(CONFIG.PACKAGE_JSON, 'utf8'));
      return pkg.version || '1.0.0';
    }
  } catch (err) {
    // Ignore
  }
  return '1.0.0';
}

// Get executor information
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

// Get Playwright version
function getPlaywrightVersion() {
  try {
    if (fs.existsSync(CONFIG.PACKAGE_JSON)) {
      const pkg = JSON.parse(fs.readFileSync(CONFIG.PACKAGE_JSON, 'utf8'));
      return pkg.devDependencies?.['@playwright/test'] || 'Unknown';
    }
  } catch (err) {
    // Ignore
  }
  return 'Unknown';
}

// Format duration
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
}

// Format timestamp
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

// Get status color
function getStatusColor(status) {
  switch (status?.toLowerCase()) {
    case 'passed': return COLORS.success;
    case 'failed': return COLORS.error;
    case 'skipped': return COLORS.skipped;
    case 'blocked': return COLORS.blocked;
    case 'broken': return COLORS.broken;
    default: return COLORS.mediumGray;
  }
}

// Get status icon
function getStatusIcon(status) {
  switch (status?.toLowerCase()) {
    case 'passed': return '✓';
    case 'failed': return '✗';
    case 'skipped': return '⊘';
    case 'blocked': return '⊗';
    case 'broken': return '⊠';
    default: return '•';
  }
}

// Sanitize sensitive data
function sanitizeText(text) {
  if (!CONFIG.excludeSensitiveData || !text) return text;

  // Remove potential passwords, tokens, API keys
  let sanitized = text;
  sanitized = sanitized.replace(/password[=:]\s*\S+/gi, 'password=***');
  sanitized = sanitized.replace(/token[=:]\s*\S+/gi, 'token=***');
  sanitized = sanitized.replace(/api[_-]?key[=:]\s*\S+/gi, 'api_key=***');
  sanitized = sanitized.replace(/bearer\s+\S+/gi, 'bearer ***');

  return sanitized;
}
function parsePlaywrightReport() {
  if (!fs.existsSync(MOCHAWESOME_JSON)) {
    console.error('❌ Error: Test results not found!');
    console.error(`   Expected location: ${MOCHAWESOME_JSON}`);
    console.error('   Please run your tests first to generate the report.');
    process.exit(1);
  }

  console.log(`📊 Reading test results from ${path.basename(MOCHAWESOME_JSON)}`);

  const allTests = [];


// ==================== DATA PARSING ====================

// Parse Playwright report data
function parsePlaywrightReport() {
  if (!fs.existsSync(CONFIG.MOCHAWESOME_JSON)) {
    console.error('❌ Error: Test results not found!');
    console.error(`   Expected location: ${CONFIG.MOCHAWESOME_JSON}`);
    console.error('   Please run your tests first to generate the report.');
    process.exit(1);
  }

  console.log(`📊 Reading test results from ${path.basename(CONFIG.MOCHAWESOME_JSON)}`);

  const allTests = [];
  let testConfig = null;
  let executionStart = null;
  let executionEnd = null;

  try {
    const data = JSON.parse(fs.readFileSync(CONFIG.MOCHAWESOME_JSON, 'utf8'));
    testConfig = data.config;

    if (data && data.suites) {
      extractTestsFromMochawesome(data.suites, allTests);
    }

    // Calculate execution time range
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
    console.error(`❌ Could not parse test results:`, err.message);
    process.exit(1);
  }

  return {
    tests: allTests,
    config: testConfig,
    executionStart: executionStart || timestamp,
    executionEnd: executionEnd || timestamp
  };
}

function extractTestsFromMochawesome(suites, allTests, parentTitle = '') {
  if (!suites) return;

  suites.forEach(suite => {
    const suiteTitle = parentTitle ? `${parentTitle} > ${suite.title}` : suite.title;

    // Process specs (test cases)
    if (suite.specs && suite.specs.length > 0) {
      suite.specs.forEach(spec => {
        if (spec.tests && spec.tests.length > 0) {
          spec.tests.forEach(test => {
            const result = test.results && test.results[0];
            if (result) {
              // Find screenshot from attachments
              let screenshot = null;
              let videoPath = null;

              if (result.attachments) {
                const screenshotAttachment = result.attachments.find(att =>
                  att.contentType && att.contentType.includes('image')
                );
                if (screenshotAttachment && screenshotAttachment.path) {
                  screenshot = screenshotAttachment.path;
                }

                const videoAttachment = result.attachments.find(att =>
                  att.contentType && att.contentType.includes('video')
                );
                if (videoAttachment && videoAttachment.path) {
                  videoPath = videoAttachment.path;
                }
              }

              // Determine status
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

              // Calculate end time
              const startTime = result.startTime ? new Date(result.startTime) : null;
              const endTime = startTime && result.duration ?
                new Date(startTime.getTime() + result.duration) : null;

              // Extract test ID from title (e.g., "TC0003: should have correct title")
              const testIdMatch = spec.title.match(/^(TC\d+):/);
              const testId = testIdMatch ? testIdMatch[1] : `TC${allTests.length + 1}`;
              const testTitle = spec.title.replace(/^TC\d+:\s*/, '');

              // Extract tags/categories
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
                projectName: test.projectName || 'chromium',
                category: category,
                tags: tags,
                retry: result.retry || 0,
                workerIndex: result.workerIndex || 0
              });
            }
          });
        }
      });
    }

    // Recursively process nested suites
    if (suite.suites && suite.suites.length > 0) {
      extractTestsFromMochawesome(suite.suites, allTests, suiteTitle);
    }
  });
}


// ==================== PDF GENERATION ====================

function createPDF(reportData) {
  const { tests, config, executionStart, executionEnd } = reportData;
  
  // Filter tests if needed
  let filteredTests = CONFIG.includeAllTests ? tests : tests.filter(t => t.status === 'failed');
  
  // Group tests if needed
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
  
  // Create output directory if needed
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
      Keywords: 'playwright, testing, automation, report'
    }
  });

  const stream = fs.createWriteStream(OUTPUT_FILE);
  doc.pipe(stream);

  const executor = getExecutorInfo();
  const gitInfo = getGitInfo();
  const appVersion = getAppVersion();
  const playwrightVersion = getPlaywrightVersion();
  
  // Statistics
  const totalTests = tests.length;
  const passed = tests.filter(t => t.status === 'passed').length;
  const failed = tests.filter(t => t.status === 'failed').length;
  const skipped = tests.filter(t => t.status === 'skipped').length;
  const blocked = tests.filter(t => t.status === 'blocked').length;
  const broken = tests.filter(t => t.status === 'broken').length;
  const totalDuration = tests.reduce((sum, t) => sum + t.duration, 0);
  const overallStatus = failed > 0 || broken > 0 ? 'FAILED' : (passed > 0 ? 'PASSED' : 'NO RESULTS');
  
  // ========== COVER PAGE ==========
  generateCoverPage(doc, {
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
    gitInfo
  });
  
  // ========== SUMMARY PAGE ==========
  doc.addPage();
  generateSummaryPage(doc, {
    executor,
    executionStart,
    executionEnd,
    totalTests,
    passed,
    failed,
    skipped,
    blocked,
    broken,
    totalDuration,
    overallStatus,
    appVersion,
    gitInfo,
    playwrightVersion
  });
  
  // ========== TEST DETAILS TABLE ==========
  doc.addPage();
  generateTestDetailsTable(doc, groupedTests);
  
  // ========== INDIVIDUAL TEST PAGES ==========
  Object.keys(groupedTests).forEach(groupName => {
    groupedTests[groupName].forEach((test, index) => {
      doc.addPage();
      generateTestDetailPage(doc, test, index + 1, filteredTests.length);
    });
  });
  
  // ========== SCREENSHOT APPENDIX (if configured) ==========
  if (CONFIG.screenshotMode === 'appendix') {
    doc.addPage();
    generateScreenshotAppendix(doc, filteredTests);
  }
  
  // Add page numbers
  addPageNumbers(doc);
  
  // Finalize PDF
  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => {
      console.log('✅ PDF generated successfully!');
      console.log(`📁 PDF location: ${OUTPUT_FILE}`);
      
      const stats = fs.statSync(OUTPUT_FILE);
      const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`📦 File size: ${fileSizeInMB} MB\n`);
      
      resolve(OUTPUT_FILE);
    });

    stream.on('error', reject);
  });
}
  // Create output directory if needed
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
    info: {
      Title: 'Playwright Test Report',
      Author: os.userInfo().username,
      Subject: 'Automated Test Results',
      Keywords: 'playwright, testing, automation'
    }
  });

  const stream = fs.createWriteStream(OUTPUT_FILE);
  doc.pipe(stream);

  let pageNumber = 1;

  // Helper function to add page numbers
  function addPageNumber() {
    doc.fontSize(8)
       .fillColor('#999999')
       .text(
         `Page ${pageNumber}`,
         50,
         doc.page.height - 30,
         { align: 'center' }
       );
    pageNumber++;
  }

  // === COVER PAGE ===
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.primary);

  doc.fontSize(48)
     .fillColor(COLORS.white)
     .font('Helvetica-Bold')
     .text('Test Report', 50, 200, { align: 'center' });

  doc.fontSize(24)
     .fillColor(COLORS.white)
     .font('Helvetica')
     .text('Playwright Automation Results', 50, 270, { align: 'center' });

  // Test summary box
  const passed = tests.filter(t => t.status === 'passed').length;
  const failed = tests.filter(t => t.status === 'failed').length;
  const skipped = tests.filter(t => t.status === 'skipped').length;
  const totalTests = tests.length;
  const totalDuration = tests.reduce((sum, t) => sum + t.duration, 0);

  doc.fontSize(18)
     .fillColor(COLORS.white)
     .text(`Total Tests: ${totalTests}`, 50, 380, { align: 'center' });

  doc.fontSize(14)
     .text(`✓ Passed: ${passed}  ✗ Failed: ${failed}  ⊘ Skipped: ${skipped}`, 50, 420, { align: 'center' });

  // Report metadata
  const reportDate = new Date().toLocaleString();
  const executedBy = os.userInfo().username || 'Unknown';
  const hostname = os.hostname();

  doc.fontSize(12)
     .fillColor(COLORS.white)
     .moveDown(8)
     .text(`Executed by: ${executedBy}`, 50, 550, { align: 'center' })
     .text(`Hostname: ${hostname}`, 50, 575, { align: 'center' })
     .text(`Generated: ${reportDate}`, 50, 600, { align: 'center' })
     .text(`Duration: ${(totalDuration / 1000).toFixed(2)}s`, 50, 625, { align: 'center' });

  addPageNumber();

  // === SUMMARY PAGE ===
  doc.addPage();

  doc.fontSize(24)
     .fillColor(COLORS.primary)
     .font('Helvetica-Bold')
     .text('Test Summary', 50, 50);

  doc.moveDown(1);

  // Summary table
  const tableTop = 120;
  const tableLeft = 50;
  const colWidth = (doc.page.width - 100) / 2;

  // Table header
  doc.rect(tableLeft, tableTop, colWidth * 2, 30).fill(COLORS.primary);
  doc.fontSize(12)
     .fillColor(COLORS.white)
     .font('Helvetica-Bold')
     .text('Metric', tableLeft + 10, tableTop + 10, { width: colWidth - 20 })
     .text('Value', tableLeft + colWidth + 10, tableTop + 10, { width: colWidth - 20 });

  let rowY = tableTop + 30;
  const rowHeight = 25;

  const summaryData = [
    ['Total Test Cases', totalTests],
    ['Passed', `${passed} (${totalTests > 0 ? ((passed / totalTests) * 100).toFixed(1) : 0}%)`],
    ['Failed', `${failed} (${totalTests > 0 ? ((failed / totalTests) * 100).toFixed(1) : 0}%)`],
    ['Skipped', `${skipped} (${totalTests > 0 ? ((skipped / totalTests) * 100).toFixed(1) : 0}%)`],
    ['Total Duration', `${(totalDuration / 1000).toFixed(2)} seconds`],
    ['Average Duration', `${totalTests > 0 ? (totalDuration / totalTests / 1000).toFixed(2) : 0} seconds`]
  ];

  summaryData.forEach((row, index) => {
    const bgColor = index % 2 === 0 ? COLORS.lightGray : COLORS.white;
    doc.rect(tableLeft, rowY, colWidth * 2, rowHeight).fill(bgColor);

    doc.fontSize(11)
       .fillColor(COLORS.black)
       .font('Helvetica')
       .text(row[0], tableLeft + 10, rowY + 7, { width: colWidth - 20 })
       .font('Helvetica-Bold')
       .text(String(row[1]), tableLeft + colWidth + 10, rowY + 7, { width: colWidth - 20 });

    rowY += rowHeight;
  });

  addPageNumber();

  // === TEST DETAILS PAGES ===
  tests.forEach((test, index) => {
    doc.addPage();

    // Test number and title
    doc.fontSize(10)
       .fillColor(COLORS.darkGray)
       .font('Helvetica')
       .text(`Test Case ${index + 1} of ${totalTests}`, 50, 50);

    doc.fontSize(18)
       .fillColor(COLORS.primary)
       .font('Helvetica-Bold')
       .text(test.title, 50, 70, { width: doc.page.width - 100 });

    // Suite path
    if (test.suite) {
      doc.fontSize(10)
         .fillColor(COLORS.darkGray)
         .font('Helvetica')
         .text(`Suite: ${test.suite}`, 50, 110, { width: doc.page.width - 100 });
    }

    // Status badge
    const statusY = 140;
    let statusColor = COLORS.success;
    let statusText = '✓ PASSED';

    if (test.status === 'failed') {
      statusColor = COLORS.error;
      statusText = '✗ FAILED';
    } else if (test.status === 'skipped') {
      statusColor = COLORS.warning;
      statusText = '⊘ SKIPPED';
    }

    doc.roundedRect(50, statusY, 100, 30, 5).fill(statusColor);
    doc.fontSize(12)
       .fillColor(COLORS.white)
       .font('Helvetica-Bold')
       .text(statusText, 50, statusY + 8, { width: 100, align: 'center' });

    // Duration
    doc.fontSize(10)
       .fillColor(COLORS.darkGray)
       .font('Helvetica')
       .text(`Duration: ${(test.duration / 1000).toFixed(2)}s`, 160, statusY + 10);

    // Error message if failed
    if (test.error) {
      doc.fontSize(11)
         .fillColor(COLORS.error)
         .font('Helvetica-Bold')
         .text('Error:', 50, statusY + 50);

      doc.fontSize(9)
         .fillColor(COLORS.darkGray)
         .font('Helvetica')
         .text(test.error, 50, statusY + 70, {
           width: doc.page.width - 100,
           height: 80
         });
    }

    // Screenshot
    const screenshotY = test.error ? statusY + 160 : statusY + 50;

    if (test.screenshot && fs.existsSync(test.screenshot)) {
      try {
        doc.fontSize(11)
           .fillColor(COLORS.darkGray)
           .font('Helvetica-Bold')
           .text('Screenshot:', 50, screenshotY);

        const maxWidth = doc.page.width - 100;
        const maxHeight = doc.page.height - screenshotY - 100;

        doc.image(test.screenshot, 50, screenshotY + 20, {
          fit: [maxWidth, maxHeight],
          align: 'center'
        });
      } catch (err) {
        console.warn(`⚠️  Could not add screenshot for test "${test.title}":`, err.message);
        doc.fontSize(9)
           .fillColor(COLORS.warning)
           .font('Helvetica-Oblique')
           .text('Screenshot could not be loaded', 50, screenshotY + 20);
      }
    } else {
      doc.fontSize(9)
         .fillColor(COLORS.darkGray)
         .font('Helvetica-Oblique')
         .text('No screenshot available', 50, screenshotY + 20);
    }

    addPageNumber();
  });

  // Finalize PDF
  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => {
      console.log('✅ PDF generated successfully!');
      console.log(`📁 PDF location: ${OUTPUT_FILE}`);

      const stats = fs.statSync(OUTPUT_FILE);
      const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`📦 File size: ${fileSizeInMB} MB\n`);

      resolve(OUTPUT_FILE);
    });

    stream.on('error', reject);
  });
}

// Main execution
(async () => {
  try {
    console.log('📊 Parsing test results...');
    const tests = parsePlaywrightReport();

    console.log(`✅ Found ${tests.length} test cases`);
    console.log(`   • Passed: ${tests.filter(t => t.status === 'passed').length}`);
    console.log(`   • Failed: ${tests.filter(t => t.status === 'failed').length}`);
    console.log(`   • Skipped: ${tests.filter(t => t.status === 'skipped').length}\n`);

    console.log('📝 Generating PDF report...');
    await createPDF(tests);

    console.log('🎉 Custom Playwright PDF report generated successfully!\n');
    console.log(`📖 Open the report: ${path.basename(OUTPUT_FILE)}\n`);

  } catch (error) {
    console.error('\n❌ Error generating PDF:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();

