#!/usr/bin/env node

/**
 * Professional Executive Test Report Generator
 * Creates a comprehensive PDF with ALL test results and screenshots
 * Reads directly from test results for maximum reliability
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const RESULTS_DIR = path.join(__dirname, '../allure-results');
const OUTPUT_DIR = path.join(__dirname, '../reports');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
const OUTPUT_FILE = path.join(OUTPUT_DIR, `executive-test-report-${timestamp}.pdf`);

console.log('📊 Creating Professional Executive Test Report...\n');

if (!fs.existsSync(RESULTS_DIR)) {
  console.error('❌ Error: Test results not found!');
  console.error('   Please run tests first: npm test');
  process.exit(1);
}

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Read all test result files
console.log('📖 Reading test results...');
const files = fs.readdirSync(RESULTS_DIR);
const resultFiles = files.filter(f => f.endsWith('-result.json'));
const screenshotFiles = files.filter(f => f.endsWith('.png'));
const videoFiles = files.filter(f => f.endsWith('.webm'));

console.log(`   Found ${resultFiles.length} test results`);
console.log(`   Found ${screenshotFiles.length} screenshots`);
console.log(`   Found ${videoFiles.length} videos`);

// Parse test results
const testResults = resultFiles.map(file => {
  try {
    const content = fs.readFileSync(path.join(RESULTS_DIR, file), 'utf8');
    return JSON.parse(content);
  } catch (e) {
    return null;
  }
}).filter(r => r !== null);

// Group by status
const passed = testResults.filter(t => t.status === 'passed');
const failed = testResults.filter(t => t.status === 'failed');
const broken = testResults.filter(t => t.status === 'broken');
const skipped = testResults.filter(t => t.status === 'skipped');

console.log('\n📊 Test Summary:');
console.log(`   ✅ Passed: ${passed.length}`);
console.log(`   ❌ Failed: ${failed.length}`);
console.log(`   ⚠️  Broken: ${broken.length}`);
console.log(`   ⏭️  Skipped: ${skipped.length}`);
console.log(`   📝 Total: ${testResults.length}`);

// Create PDF
console.log('\n📄 Generating PDF report...');

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
  bufferPages: true
});

const stream = fs.createWriteStream(OUTPUT_FILE);
doc.pipe(stream);

let pageNumber = 1;

// Helper function to add header
function addHeader() {
  const y = 30;
  doc.fontSize(10)
     .fillColor('#4CAF50')
     .text('Quality Assurance Test Report', 50, y, { align: 'center' });
  doc.moveTo(50, y + 15).lineTo(545, y + 15).stroke('#4CAF50');
}

// Helper function to add footer
function addFooter() {
  const y = 792 - 30;
  doc.fontSize(8)
     .fillColor('#666666')
     .text(
       `Page ${pageNumber} | Generated: ${new Date().toLocaleDateString('en-US', { 
         year: 'numeric', 
         month: 'long', 
         day: 'numeric' 
       })} | Confidential`,
       50,
       y,
       { align: 'center' }
     );
  pageNumber++;
}

// Title Page
doc.fontSize(28)
   .fillColor('#2C3E50')
   .text('Test Execution Report', { align: 'center' });

doc.moveDown(0.5);
doc.fontSize(14)
   .fillColor('#7F8C8D')
   .text('Quality Assurance Dashboard', { align: 'center' });

doc.moveDown(3);

// Summary Box
const summaryY = doc.y;
doc.rect(100, summaryY, 395, 150)
   .fillAndStroke('#F8F9FA', '#DDDDDD');

doc.fontSize(16)
   .fillColor('#2C3E50')
   .text('Test Execution Summary', 120, summaryY + 20);

doc.fontSize(12)
   .fillColor('#27AE60')
   .text(`✓ Passed: ${passed.length}`, 120, summaryY + 50);

doc.fillColor('#E74C3C')
   .text(`✗ Failed: ${failed.length}`, 120, summaryY + 70);

doc.fillColor('#F39C12')
   .text(`⚠ Broken: ${broken.length}`, 120, summaryY + 90);

doc.fillColor('#95A5A6')
   .text(`⊘ Skipped: ${skipped.length}`, 120, summaryY + 110);

doc.fontSize(14)
   .fillColor('#2C3E50')
   .text(`Total Tests: ${testResults.length}`, 320, summaryY + 70, { width: 150 });

// Calculate pass rate
const passRate = testResults.length > 0 
  ? ((passed.length / testResults.length) * 100).toFixed(1)
  : 0;

doc.fontSize(16)
   .fillColor(passRate >= 90 ? '#27AE60' : passRate >= 70 ? '#F39C12' : '#E74C3C')
   .text(`Pass Rate: ${passRate}%`, 320, summaryY + 100, { width: 150 });

doc.moveDown(8);

doc.fontSize(10)
   .fillColor('#95A5A6')
   .text(`Total Screenshots: ${screenshotFiles.length}`, { align: 'center' });
doc.text(`Total Videos: ${videoFiles.length}`, { align: 'center' });

addFooter();

// Detailed Results
doc.addPage();
addHeader();
doc.moveDown(2);

doc.fontSize(18)
   .fillColor('#2C3E50')
   .text('Detailed Test Results', 50, 80);

doc.moveDown(1);

let testCount = 0;

// Function to add test details
function addTest(test, statusColor, statusIcon) {
  testCount++;
  
  // Check if we need a new page
  if (doc.y > 700) {
    addFooter();
    doc.addPage();
    addHeader();
    doc.moveDown(2);
  }

  const startY = doc.y;
  
  // Test number and status
  doc.fontSize(11)
     .fillColor('#2C3E50')
     .text(`${testCount}. `, 50, startY, { continued: true })
     .fillColor(statusColor)
     .text(`${statusIcon} `, { continued: true })
     .fillColor('#2C3E50')
     .text(test.name || 'Unnamed Test');

  doc.moveDown(0.3);

  // Duration
  if (test.stop && test.start) {
    const duration = ((test.stop - test.start) / 1000).toFixed(2);
    doc.fontSize(9)
       .fillColor('#7F8C8D')
       .text(`Duration: ${duration}s`, 70);
  }

  // Status message
  if (test.statusDetails && test.statusDetails.message) {
    doc.moveDown(0.3);
    doc.fontSize(9)
       .fillColor('#E74C3C')
       .text(`Error: ${test.statusDetails.message.substring(0, 200)}`, 70, doc.y, {
         width: 450,
         lineGap: 2
       });
  }

  doc.moveDown(0.5);

  // Recursively find all screenshots in test steps
  const allScreenshots = [];

  function findScreenshots(obj) {
    if (!obj) return;

    // Check attachments at current level
    if (obj.attachments && Array.isArray(obj.attachments)) {
      obj.attachments.forEach(att => {
        if (att.type && att.type.includes('image') && att.source) {
          allScreenshots.push(att.source);
        }
      });
    }

    // Recursively check steps
    if (obj.steps && Array.isArray(obj.steps)) {
      obj.steps.forEach(step => findScreenshots(step));
    }
  }

  // Find screenshots in main test and all nested steps
  findScreenshots(test);

  // Add all found screenshots
  if (allScreenshots.length > 0) {
    console.log(`   📸 Adding ${allScreenshots.length} screenshot(s) for test: ${test.name}`);

    allScreenshots.forEach((screenshotSource, index) => {
      const screenshotPath = path.join(RESULTS_DIR, screenshotSource);

      if (fs.existsSync(screenshotPath)) {
        try {
          // Check if we need a new page for the screenshot
          if (doc.y > 550) {
            addFooter();
            doc.addPage();
            addHeader();
            doc.moveDown(2);
          }

          doc.fontSize(9)
             .fillColor('#7F8C8D')
             .text(`Screenshot ${index + 1}:`, 70);
          
          doc.moveDown(0.5);

          const currentY = doc.y;

          // Add screenshot (scaled to fit)
          const maxWidth = 480;
          const maxHeight = 300;

          const image = doc.image(screenshotPath, 60, currentY, {
            fit: [maxWidth, maxHeight],
            align: 'center'
          });

          // Calculate actual image dimensions after scaling
          const imageDimensions = doc._imageRegistry[doc._imageRegistry.length - 1];
          let actualHeight = maxHeight;

          // Try to get the actual scaled height
          try {
            const img = doc.openImage(screenshotPath);
            const aspectRatio = img.height / img.width;
            const scaledWidth = Math.min(img.width, maxWidth);
            actualHeight = Math.min(scaledWidth * aspectRatio, maxHeight);
          } catch (e) {
            // Use maxHeight as fallback
            actualHeight = maxHeight;
          }

          // Move Y position past the image with proper spacing
          doc.y = currentY + actualHeight + 10; // Add 10px padding after image

        } catch (err) {
          console.error(`   ⚠️  Could not embed screenshot: ${screenshotSource}`);
          console.error(`   Error: ${err.message}`);
        }
      } else {
        console.error(`   ⚠️  Screenshot not found: ${screenshotPath}`);
      }
    });
  }

  doc.moveDown(1);

  // Separator line
  doc.moveTo(50, doc.y)
     .lineTo(545, doc.y)
     .stroke('#EEEEEE');
  
  doc.moveDown(1);
}

// Add failed tests first (most important)
if (failed.length > 0) {
  doc.fontSize(14)
     .fillColor('#E74C3C')
     .text('❌ Failed Tests', 50);
  doc.moveDown(0.5);

  failed.forEach(test => addTest(test, '#E74C3C', '✗'));
}

// Add broken tests
if (broken.length > 0) {
  if (doc.y > 700) {
    addFooter();
    doc.addPage();
    addHeader();
    doc.moveDown(2);
  }

  doc.fontSize(14)
     .fillColor('#F39C12')
     .text('⚠️ Broken Tests', 50);
  doc.moveDown(0.5);

  broken.forEach(test => addTest(test, '#F39C12', '⚠'));
}

// Add passed tests
if (passed.length > 0) {
  if (doc.y > 700) {
    addFooter();
    doc.addPage();
    addHeader();
    doc.moveDown(2);
  }

  doc.fontSize(14)
     .fillColor('#27AE60')
     .text('✅ Passed Tests', 50);
  doc.moveDown(0.5);

  passed.forEach(test => addTest(test, '#27AE60', '✓'));
}

// Final footer
addFooter();

// Finalize PDF
doc.end();

stream.on('finish', () => {
  const stats = fs.statSync(OUTPUT_FILE);
  const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log('\n✅ Executive Report Generated Successfully!');
  console.log('═══════════════════════════════════════════════════');
  console.log(`📁 Location: ${OUTPUT_FILE}`);
  console.log(`📦 Size: ${fileSizeInMB} MB`);
  console.log(`📄 Tests: ${testResults.length}`);
  console.log(`📸 Screenshots embedded: ${screenshotFiles.length}`);
  console.log(`📊 Pass Rate: ${passRate}%`);
  console.log('═══════════════════════════════════════════════════');
  console.log('\n🎉 Report ready for executive presentation!\n');
});

stream.on('error', (err) => {
  console.error('❌ Error writing PDF:', err);
  process.exit(1);
});
