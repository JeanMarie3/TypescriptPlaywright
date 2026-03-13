#!/usr/bin/env node

/**
 * Generate Mochawesome-style HTML Report from Playwright JSON output
 * This script transforms Playwright test results into a Mochawesome-compatible format
 */

const fs = require('fs');
const path = require('path');

const JSON_FILE = path.join(__dirname, '../mochawesome-report/mochawesome.json');
const OUTPUT_DIR = path.join(__dirname, '../reports/mochawesome');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'mochawesome-report.html');

console.log('🎨 Generating Mochawesome-style Report...\n');

// Check if mochawesome.json exists
if (!fs.existsSync(JSON_FILE)) {
  console.error('❌ Error: mochawesome.json not found!');
  console.error('   Please run your tests first to generate the report data.');
  console.error('   Command: npm test\n');
  process.exit(1);
}

try {
  // Create output directory if it doesn't exist
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log('✅ Created output directory: reports/mochawesome\n');
  }

  // Read Playwright JSON results
  console.log('📊 Reading test results...');
  const playwrightResults = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));

  // Parse results from Playwright's nested structure
  const suites = playwrightResults.suites || [];
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  let skippedTests = 0;
  let duration = 0;

  const processedSuites = [];

  // Recursive function to process nested suites
  function processSuite(suite, parentTitle = '') {
    const suiteTitle = suite.title || 'Test Suite';
    const fullTitle = parentTitle ? `${parentTitle} > ${suiteTitle}` : suiteTitle;

    const suiteData = {
      title: fullTitle,
      file: suite.file || '',
      tests: []
    };

    // Process specs in this suite
    if (suite.specs && suite.specs.length > 0) {
      suite.specs.forEach(spec => {
        if (spec.tests && spec.tests.length > 0) {
          spec.tests.forEach(test => {
            totalTests++;
            const result = test.results && test.results[0];

            const status = result?.status || 'unknown';
            const testDuration = result?.duration || 0;
            duration += testDuration;

            if (status === 'passed') passedTests++;
            else if (status === 'failed' || status === 'timedOut') failedTests++;
            else if (status === 'skipped') skippedTests++;

            suiteData.tests.push({
              title: spec.title || 'Untitled Test',
              status: status,
              duration: testDuration,
              error: result?.error?.message || null,
              errorSnippet: result?.error?.snippet || null
            });
          });
        }
      });
    }

    // Only add suite if it has tests
    if (suiteData.tests.length > 0) {
      processedSuites.push(suiteData);
    }

    // Process nested suites recursively
    if (suite.suites && suite.suites.length > 0) {
      suite.suites.forEach(subSuite => processSuite(subSuite, fullTitle));
    }
  }

  // Process all top-level suites
  suites.forEach(suite => processSuite(suite));

  const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;

  // Generate HTML report
  console.log('🎨 Generating HTML report...');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mochawesome Test Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #f5f5f5;
            padding: 20px;
        }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 8px 8px 0 0;
        }
        .header h1 { font-size: 32px; margin-bottom: 10px; }
        .header .subtitle { opacity: 0.9; font-size: 14px; }
        .stats { 
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #fafafa;
        }
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            border-left: 4px solid #667eea;
        }
        .stat-card.pass { border-left-color: #10b981; }
        .stat-card.fail { border-left-color: #ef4444; }
        .stat-card.skip { border-left-color: #f59e0b; }
        .stat-card h3 { font-size: 14px; color: #6b7280; margin-bottom: 10px; text-transform: uppercase; }
        .stat-card .value { font-size: 36px; font-weight: bold; color: #1f2937; }
        .stat-card .label { font-size: 12px; color: #9ca3af; margin-top: 5px; }
        .suites { padding: 30px; }
        .suite {
            margin-bottom: 30px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
        }
        .suite-header {
            background: #f9fafb;
            padding: 15px 20px;
            border-bottom: 1px solid #e5e7eb;
            font-weight: 600;
            color: #374151;
        }
        .test {
            padding: 15px 20px;
            border-bottom: 1px solid #f3f4f6;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .test:last-child { border-bottom: none; }
        .test:hover { background: #fafafa; }
        .test-title { flex: 1; }
        .test-status {
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            margin-left: 10px;
        }
        .test-status.passed { background: #d1fae5; color: #065f46; }
        .test-status.failed { background: #fee2e2; color: #991b1b; }
        .test-status.skipped { background: #fef3c7; color: #92400e; }
        .test-duration { color: #9ca3af; font-size: 12px; margin-left: 10px; }
        .error {
            background: #fef2f2;
            border-left: 3px solid #ef4444;
            padding: 10px 15px;
            margin-top: 10px;
            font-size: 13px;
            color: #991b1b;
            border-radius: 4px;
        }
        .progress-bar {
            height: 8px;
            background: #e5e7eb;
            border-radius: 4px;
            overflow: hidden;
            margin: 20px 30px;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #10b981 0%, #059669 100%);
            transition: width 0.3s ease;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Test Report</h1>
            <div class="subtitle">Playwright Test Automation Results</div>
        </div>

        <div class="progress-bar">
            <div class="progress-fill" style="width: ${passRate}%"></div>
        </div>

        <div class="stats">
            <div class="stat-card">
                <h3>Total Tests</h3>
                <div class="value">${totalTests}</div>
                <div class="label">Test cases executed</div>
            </div>
            <div class="stat-card pass">
                <h3>Passed</h3>
                <div class="value">${passedTests}</div>
                <div class="label">${passRate}% success rate</div>
            </div>
            <div class="stat-card fail">
                <h3>Failed</h3>
                <div class="value">${failedTests}</div>
                <div class="label">${totalTests > 0 ? ((failedTests / totalTests) * 100).toFixed(1) : 0}% failure rate</div>
            </div>
            <div class="stat-card skip">
                <h3>Skipped</h3>
                <div class="value">${skippedTests}</div>
                <div class="label">Tests not executed</div>
            </div>
            <div class="stat-card">
                <h3>Duration</h3>
                <div class="value">${(duration / 1000).toFixed(1)}s</div>
                <div class="label">Total execution time</div>
            </div>
        </div>

        <div class="suites">
            ${processedSuites.map(suite => `
                <div class="suite">
                    <div class="suite-header">
                        📂 ${suite.title || suite.file}
                    </div>
                    ${suite.tests.map(test => `
                        <div class="test">
                            <div class="test-title">
                                ${test.title}
                                ${test.error ? `<div class="error">❌ ${test.error}</div>` : ''}
                            </div>
                            <div style="display: flex; align-items: center;">
                                <span class="test-duration">${(test.duration / 1000).toFixed(2)}s</span>
                                <span class="test-status ${test.status}">${test.status.toUpperCase()}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `).join('')}
        </div>
    </div>

    <script>
        // Add timestamp
        document.querySelector('.subtitle').innerHTML += ' • Generated: ${new Date().toLocaleString()}';
    </script>
</body>
</html>`;

  fs.writeFileSync(OUTPUT_FILE, html);

  console.log('\n✅ Mochawesome-style report generated successfully!');
  console.log(`📁 Report location: ${OUTPUT_FILE}`);
  console.log(`\n📊 Test Summary:`);
  console.log(`   Total: ${totalTests}`);
  console.log(`   ✅ Passed: ${passedTests}`);
  console.log(`   ❌ Failed: ${failedTests}`);
  console.log(`   ⏭️  Skipped: ${skippedTests}`);
  console.log(`   📈 Pass Rate: ${passRate}%`);
  console.log(`   ⏱️  Duration: ${(duration / 1000).toFixed(2)}s\n`);

} catch (error) {
  console.error('\n❌ Error generating report:', error.message);
  console.error(error.stack);
  process.exit(1);
}
