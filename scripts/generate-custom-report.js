const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Generating Professional Custom HTML Report for PDF...');

  try {
    // Read all test result files
    const resultsDir = path.join(__dirname, 'allure-results');
    const files = fs.readdirSync(resultsDir);
    const resultFiles = files.filter(f => f.endsWith('-result.json'));

    console.log(`📊 Processing ${resultFiles.length} test results...`);

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
          suites[suiteName] = { passed: 0, failed: 0, skipped: 0, broken: 0, tests: [], duration: 0 };
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
          const duration = result.stop - result.start;
          totalDuration += duration;
          suites[suiteName].duration += duration;
        }
      } catch (e) {
        console.log(`⚠️  Could not parse ${file}`);
      }
    }

    const total = testResults.length;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;

    console.log(`✅ Passed: ${passed} | ❌ Failed: ${failed} | ⏭️ Skipped: ${skipped} | 💔 Broken: ${broken}`);

    // Generate beautiful HTML report
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Execution Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f5f5;
            padding: 20px;
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            border-radius: 8px 8px 0 0;
        }
        .header h1 { font-size: 36px; margin-bottom: 10px; }
        .header .meta { opacity: 0.9; font-size: 14px; }
        
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f8f9fa;
        }
        .stat-card {
            background: white;
            padding: 25px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            border-left: 4px solid;
        }
        .stat-card.passed { border-left-color: #28a745; }
        .stat-card.failed { border-left-color: #dc3545; }
        .stat-card.skipped { border-left-color: #ffc107; }
        .stat-card.broken { border-left-color: #6f42c1; }
        .stat-card .number { font-size: 48px; font-weight: bold; margin: 10px 0; }
        .stat-card .label { color: #666; font-size: 14px; text-transform: uppercase; }
        .stat-card.passed .number { color: #28a745; }
        .stat-card.failed .number { color: #dc3545; }
        .stat-card.skipped .number { color: #ffc107; }
        .stat-card.broken .number { color: #6f42c1; }
        
        .metrics {
            padding: 30px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }
        .metric-box {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
        }
        .metric-box h3 { color: #333; margin-bottom: 15px; }
        .metric-item {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e0e0e0;
        }
        .metric-item:last-child { border-bottom: none; }
        .metric-label { color: #666; }
        .metric-value { font-weight: bold; color: #333; }
        
        .progress-bar {
            height: 30px;
            background: #e0e0e0;
            border-radius: 15px;
            overflow: hidden;
            margin: 20px 0;
            display: flex;
        }
        .progress-segment {
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
            font-weight: bold;
        }
        .progress-passed { background: #28a745; }
        .progress-failed { background: #dc3545; }
        .progress-broken { background: #6f42c1; }
        .progress-skipped { background: #ffc107; }
        
        .suites-section {
            padding: 30px;
        }
        .suites-section h2 {
            color: #333;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #667eea;
        }
        .suite {
            background: #f8f9fa;
            margin: 15px 0;
            border-radius: 8px;
            overflow: hidden;
        }
        .suite-header {
            background: #667eea;
            color: white;
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .suite-header h3 { font-size: 18px; }
        .suite-stats {
            display: flex;
            gap: 15px;
            font-size: 14px;
        }
        .suite-body {
            padding: 20px;
        }
        .test-item {
            background: white;
            padding: 15px;
            margin: 10px 0;
            border-radius: 6px;
            border-left: 4px solid;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .test-item.passed { border-left-color: #28a745; }
        .test-item.failed { border-left-color: #dc3545; }
        .test-item.skipped { border-left-color: #ffc107; }
        .test-item.broken { border-left-color: #6f42c1; }
        .test-name { flex: 1; font-weight: 500; }
        .test-status {
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .test-status.passed { background: #d4edda; color: #155724; }
        .test-status.failed { background: #f8d7da; color: #721c24; }
        .test-status.skipped { background: #fff3cd; color: #856404; }
        .test-status.broken { background: #e7d4f5; color: #6f42c1; }
        .test-duration { color: #666; font-size: 14px; margin-left: 15px; }
        .error-message {
            background: #fff3cd;
            color: #856404;
            padding: 10px;
            margin-top: 10px;
            border-radius: 4px;
            font-size: 13px;
            font-family: monospace;
        }
        
        .footer {
            background: #333;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 0 0 8px 8px;
        }
        
        @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>📊 Test Execution Report</h1>
            <div class="meta">
                Generated on ${new Date().toLocaleString()} | 
                Project: ${path.basename(__dirname)} |
                Total Tests: ${total}
            </div>
        </div>
        
        <!-- Summary Cards -->
        <div class="summary">
            <div class="stat-card passed">
                <div class="label">Passed</div>
                <div class="number">${passed}</div>
            </div>
            <div class="stat-card failed">
                <div class="label">Failed</div>
                <div class="number">${failed}</div>
            </div>
            <div class="stat-card broken">
                <div class="label">Broken</div>
                <div class="number">${broken}</div>
            </div>
            <div class="stat-card skipped">
                <div class="label">Skipped</div>
                <div class="number">${skipped}</div>
            </div>
        </div>
        
        <!-- Progress Bar -->
        <div style="padding: 0 30px;">
            <div class="progress-bar">
                ${passed > 0 ? `<div class="progress-segment progress-passed" style="width: ${(passed/total*100)}%">${passed}</div>` : ''}
                ${failed > 0 ? `<div class="progress-segment progress-failed" style="width: ${(failed/total*100)}%">${failed}</div>` : ''}
                ${broken > 0 ? `<div class="progress-segment progress-broken" style="width: ${(broken/total*100)}%">${broken}</div>` : ''}
                ${skipped > 0 ? `<div class="progress-segment progress-skipped" style="width: ${(skipped/total*100)}%">${skipped}</div>` : ''}
            </div>
        </div>
        
        <!-- Metrics -->
        <div class="metrics">
            <div class="metric-box">
                <h3>📈 Overall Metrics</h3>
                <div class="metric-item">
                    <span class="metric-label">Total Tests</span>
                    <span class="metric-value">${total}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Pass Rate</span>
                    <span class="metric-value">${passRate}%</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Total Duration</span>
                    <span class="metric-value">${(totalDuration / 1000).toFixed(2)}s</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Average Duration</span>
                    <span class="metric-value">${total > 0 ? (totalDuration / total / 1000).toFixed(2) : 0}s</span>
                </div>
            </div>
            
            <div class="metric-box">
                <h3>📦 Suite Summary</h3>
                <div class="metric-item">
                    <span class="metric-label">Total Suites</span>
                    <span class="metric-value">${Object.keys(suites).length}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Suites Passed</span>
                    <span class="metric-value" style="color: #28a745;">${Object.values(suites).filter(s => s.failed === 0 && s.broken === 0).length}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Suites with Failures</span>
                    <span class="metric-value" style="color: #dc3545;">${Object.values(suites).filter(s => s.failed > 0 || s.broken > 0).length}</span>
                </div>
            </div>
        </div>
        
        <!-- Test Suites -->
        <div class="suites-section">
            <h2>📋 Test Suites Details</h2>
            ${Object.entries(suites).map(([suiteName, suiteData]) => `
                <div class="suite">
                    <div class="suite-header">
                        <h3>${suiteName}</h3>
                        <div class="suite-stats">
                            <span>✓ ${suiteData.passed}</span>
                            <span>✗ ${suiteData.failed}</span>
                            <span>! ${suiteData.broken}</span>
                            <span>○ ${suiteData.skipped}</span>
                            <span>⏱ ${(suiteData.duration / 1000).toFixed(2)}s</span>
                        </div>
                    </div>
                    <div class="suite-body">
                        ${suiteData.tests.map(test => `
                            <div class="test-item ${test.status}">
                                <div class="test-name">${test.name || 'Unknown Test'}</div>
                                <div style="display: flex; align-items: center;">
                                    <span class="test-duration">
                                        ${test.stop && test.start ? ((test.stop - test.start) / 1000).toFixed(2) + 's' : '-'}
                                    </span>
                                    <span class="test-status ${test.status}">${test.status}</span>
                                </div>
                            </div>
                            ${(test.status === 'failed' || test.status === 'broken') && test.statusDetails && test.statusDetails.message ? 
                                `<div class="error-message">${test.statusDetails.message.substring(0, 200)}${test.statusDetails.message.length > 200 ? '...' : ''}</div>` 
                                : ''}
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p>Generated by Playwright Test Framework | Allure Reporter</p>
            <p style="margin-top: 5px; opacity: 0.7; font-size: 12px;">
                This report is optimized for PDF export
            </p>
        </div>
    </div>
</body>
</html>
    `;

    // Save HTML report
    const htmlPath = path.join(__dirname, 'custom-report.html');
    fs.writeFileSync(htmlPath, html);
    console.log(`✅ Custom HTML report generated: ${htmlPath}`);

    // Generate PDF from HTML
    console.log('📝 Converting to PDF...');
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const pdfPath = path.join(__dirname, `custom-report-${timestamp}.pdf`);

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
    });

    await browser.close();

    console.log(`✅ PDF generated successfully!`);
    console.log(`📁 HTML: ${htmlPath}`);
    console.log(`📁 PDF: ${pdfPath}`);
    console.log(`\n💡 This is a beautiful, professional report optimized for PDF!`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();

