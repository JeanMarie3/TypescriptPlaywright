#!/usr/bin/env node

/**
 * BEST-EFFORT FULL RECONSTRUCTION
 * generate-pdf-report-v25.js
 *
 * Reconstructed from the user's screenshots. This is not guaranteed to be a
 * byte-perfect copy of the original source, but it is assembled top-to-bottom
 * to match the structure and logic visible in the screenshots as closely as
 * possible.
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

require('dotenv').config({ path: path.join(__dirname, '../environments/.env.local') });

let drawPieChart;
try {
  ({ drawPieChart } = require('./modules/pie-chart'));
} catch (e) {
  drawPieChart = null;
}

/**
 * ========================================================================
 * TOSCA-STYLE PLAYWRIGHT TEST EXECUTION REPORT GENERATOR - V28
 * ========================================================================
 *
 * Generates professional PDF reports using Playwright JSON Reporter data
 * - Same data source as Playwright HTML report (100% accuracy)
 *
 * VERSION 28: ADD ALL SCREENSHOTS UNDER EACH STEP
 * ========================================================================
 */

function loadJsonReporterData() {
  const jsonPath = path.join(__dirname, '../playwright-report/resultsCustomized.json');

  if (!fs.existsSync(jsonPath)) {
    console.error('❌ Error: resultsCustomized.json not found');
    console.error('   Path checked: ' + jsonPath);
    console.error('   Run tests first with JSON reporter enabled');
    process.exit(1);
  }

  try {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    if (!data.suites || data.suites.length === 0) {
      console.error('❌ Error: resultsCustomized.json contains no test suites');
      process.exit(1);
    }

    return data;
  } catch (error) {
    console.error('❌ Error parsing resultsCustomized.json:', error.message);
    process.exit(1);
  }
}

function extractTestsFromJson(jsonData) {
  const tests = [];

  function processSuite(suite, suitePath = []) {
    const currentPath = suite.title ? [...suitePath, suite.title] : suitePath;

    if (suite.specs && suite.specs.length > 0) {
      suite.specs.forEach(spec => {
        spec.tests.forEach(test => {
          const result = test.results[test.results.length - 1] || {};
          tests.push({
            specFile: spec.file || suite.file || 'Unknown',
            testName: spec.title || 'Unnamed Test',
            suitePath: currentPath,
            status: result.status || 'unknown',
            duration: result.duration || 0,
            startTime: result.startTime ? new Date(result.startTime) : null,
            steps: result.steps || [],
            errors: result.errors || [],
            attachments: result.attachments || [],
            labels: spec.tags || spec.labels || []
          });
        });
      });
    }

    if (suite.suites && suite.suites.length > 0) {
      suite.suites.forEach(nestedSuite => processSuite(nestedSuite, currentPath));
    }
  }

  jsonData.suites.forEach(suite => processSuite(suite));
  return {
    tests,
    stats: jsonData.stats || {}
  };
}

function getExecutedByName() {
  const gainUser = process.env.GAIN_USER || '';
  if (gainUser) {
    const emailPrefix = gainUser.split('@')[0];
    return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
  }

  try {
    const gitName = execSync('git config user.name', { encoding: 'utf8' }).trim();
    if (gitName) return gitName;
  } catch (e) {}

  const windowsUser = process.env.USERNAME || '';
  if (windowsUser) return windowsUser.charAt(0).toUpperCase() + windowsUser.slice(1).toLowerCase();

  const osUser = os.userInfo().username;
  if (osUser) return osUser.charAt(0).toUpperCase() + osUser.slice(1).toLowerCase();

  return 'Unknown User';
}

function getExecutedByEmail() {
  const gainUser = process.env.GAIN_USER || '';
  if (gainUser && gainUser.includes('@')) return gainUser;

  try {
    const gitEmail = execSync('git config user.email', { encoding: 'utf8' }).trim();
    if (gitEmail) return gitEmail;
  } catch (e) {}

  const windowsUser = process.env.USERNAME || '';
  if (windowsUser) return `${windowsUser.toLowerCase()}@novartis.net`;

  const osUser = os.userInfo().username;
  if (osUser) return `${osUser.toLowerCase()}@novartis.net`;

  return 'unknown@novartis.net';
}

function getUserDomain() {
  return process.env.USERDOMAIN || 'NOVARTIS';
}

function getComputerName() {
  return process.env.COMPUTERNAME || os.hostname() || 'Unknown';
}

function getReportVersion() {
  const scriptName = path.basename(__filename);
  const versionMatch = scriptName.match(/v(\d+)/i);
  if (versionMatch) return `v${versionMatch[1]}`;
  return process.env.REPORT_VERSION || 'Unknown Version';
}

const CONFIG = {
  TEST_RESULTS_DIR: path.join(__dirname, '../resultsCustomized'),
  TESTS_DIR: path.join(__dirname, '../tests'),
  OUTPUT_DIR: path.join(__dirname, '../reports'),

  PROJECT_NAME: process.env.PROJECT_NAME || 'Enterprise GenAI Platform',
  COMPANY_NAME: process.env.COMPANY_NAME || 'Novartis',
  TEST_PHASE: process.env.TEST_PHASE || 'Regression Automation',
  URL_PATH: process.env.BASE_URL || 'https://gain-qa.novartis.net',

  REPORT_VERSION: getReportVersion(),
  AUTHOR: getExecutedByName(),
  AUTHOR_EMAIL: getExecutedByEmail(),
  USER_DOMAIN: getUserDomain(),
  COMPUTER_NAME: getComputerName(),
  ENVIRONMENT: process.env.ENV_NAME?.toUpperCase() || 'QA',

  PAGE: {
    WIDTH: 595.28,
    HEIGHT: 841.89,
    MARGIN: { TOP: 50, BOTTOM: 50, LEFT: 40, RIGHT: 40 }
  }
};

const CONTENT_WIDTH = CONFIG.PAGE.WIDTH - CONFIG.PAGE.MARGIN.LEFT - CONFIG.PAGE.MARGIN.RIGHT;
const LEFT = CONFIG.PAGE.MARGIN.LEFT;
const RIGHT = CONFIG.PAGE.WIDTH - CONFIG.PAGE.MARGIN.RIGHT;

const COLORS = {
  primary: '#0D7377',
  primaryDark: '#14505C',
  passed: '#00B050',
  failed: '#FF0000',
  broken: '#FF6600',
  skipped: '#808080',
  orange: '#FF9900',
  text: '#000000',
  textDark: '#333333',
  textLight: '#666666',
  textMuted: '#999999',
  white: '#FFFFFF',
  headerBg: '#1F4E79',
  rowAlt: '#F5F5F5',
  rowWhite: '#FFFFFF',
  cellBg: '#E7E6E6',
  lightGray: '#F2F2F2',
  errorBg: '#FFE6E6',
  border: '#000000',
  borderLight: '#CCCCCC',
  borderMedium: '#999999',
  tableBorder: '#D9D9D9',
  teal: '#0D7377',
  blue: '#0070C0',
  green: '#00B050'
};

const timestamp = new Date();
const timestampStr = timestamp.toISOString().replace(/[:.]/g, '-').substring(0, 19);
const envName = CONFIG.ENVIRONMENT;
const OUTPUT_FILE = path.join(CONFIG.OUTPUT_DIR, `Playwright-GenAI-Tests-Execution-Report-${envName}-${timestampStr}.pdf`);

function formatDuration(ms) {
  if (!ms || ms < 0) return '0.0s';
  const totalSeconds = ms / 1000;
  const totalMinutes = totalSeconds / 60;
  const totalHours = totalMinutes / 60;
  if (totalHours >= 1) return `${totalHours.toFixed(1)}h`;
  if (totalMinutes >= 1) return `${totalMinutes.toFixed(1)}m`;
  return `${totalSeconds.toFixed(1)}s`;
}

function formatDateTime(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('en-GB', { month: 'short' });
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${day} ${month} ${year}, ${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
}

function truncateText(text, maxLength) {
  if (!text) return '';
  return text.length <= maxLength ? text : text.substring(0, maxLength - 3) + '...';
}

function getStatusColor(status) {
  switch ((status || '').toLowerCase()) {
    case 'passed': return COLORS.passed;
    case 'failed': return COLORS.failed;
    case 'timedout': return COLORS.failed;
    case 'broken': return COLORS.broken;
    default: return COLORS.skipped;
  }
}

function getStatusText(status) {
  switch ((status || '').toLowerCase()) {
    case 'passed': return 'PASSED';
    case 'failed': return 'FAILED';
    case 'timedout': return 'FAILED';
    case 'broken': return 'ERROR';
    default: return 'NOT EXECUTED';
  }
}

function humanizePlaywrightStep(rawStepName) {
  if (!rawStepName) {
    return { displayName: 'Unknown Step', fieldName: 'Unknown', value: '', action: 'Verify' };
  }

  const stepName = rawStepName;
  const lowerName = rawStepName.toLowerCase();

  const isPlaywrightLocator = /getBy|locator\s*\(|\.filter\s*\(|\.first\s*\(|\.nth\s*\(|^Fill|click|Type\s+"[^"]+"|^getBy/i.test(stepName);

  if (!isPlaywrightLocator) {
    let action = 'Verify';
    if (lowerName.includes('navigate') || lowerName.includes('go to')) action = 'Navigate';
    else if (lowerName.includes('click')) action = 'Click';
    else if (lowerName.includes('fill') || lowerName.includes('enter') || lowerName.includes('input') || lowerName.includes('type')) action = 'Input';
    else if (lowerName.includes('verify') || lowerName.includes('check') || lowerName.includes('assert') || lowerName.includes('expect')) action = 'Verify';
    else if (lowerName.includes('wait')) action = 'Wait';
    else if (lowerName.includes('select') || lowerName.includes('choose')) action = 'Select';
    else if (lowerName.includes('capture') || lowerName.includes('screenshot')) action = 'Capture';

    return { displayName: stepName, fieldName: stepName, value: '', action };
  }

  let extractedValue = '';
  const fillValueMatch = stepName.match(/^Fill\s+"([^"]+)"\s+/i);
  if (fillValueMatch) extractedValue = fillValueMatch[1];

  let elementName = '';
  const roleNameMatch = stepName.match(/getByRole\s*\(\s*'([^']+)'\s*,\s*\{\s*name:\s*'([^']+)'/i);
  if (roleNameMatch) elementName = roleNameMatch[2];

  const textMatch = stepName.match(/getByText\s*\(\s*'([^']+)'/i);
  if (textMatch && !elementName) elementName = textMatch[1];

  const titleMatch = stepName.match(/getByTitle\s*\(\s*'([^']+)'/i);
  if (titleMatch && !elementName) elementName = titleMatch[1];

  const placeholderMatch = stepName.match(/getByPlaceholder\s*\(\s*'([^']+)'/i);
  if (placeholderMatch && !elementName) elementName = placeholderMatch[1];

  const locatorTitleMatch = stepName.match(/locator\s*\([^)]*title\s*=\s*["']([^"']+)["']/i);
  if (locatorTitleMatch && !elementName) elementName = locatorTitleMatch[1];

  const locatorIdMatch = stepName.match(/locator\s*\(\s*['"]#([^"']+)['"]/i);
  if (locatorIdMatch && !elementName) {
    elementName = locatorIdMatch[1].replace(/-\d+$/, '').replace(/-/g, ' ');
    elementName = elementName.charAt(0).toUpperCase() + elementName.slice(1);
  }

  const hasTextMatch = stepName.match(/hasText:\s*["']([^"']+)["']/i);
  if (hasTextMatch && !elementName) elementName = hasTextMatch[1];

  const regexTextMatch = stepName.match(/\^([^$]+)\$\//);
  if (regexTextMatch && !elementName) elementName = regexTextMatch[1];

  let action = 'Verify';
  let displayName = stepName;
  let fieldName = elementName || 'Element';

  if (lowerName.startsWith('click')) {
    action = 'Click';
    if (elementName) {
      if (roleNameMatch && roleNameMatch[1]) {
        const roleType = roleNameMatch[1].toLowerCase();
        if (roleType === 'button') displayName = `Click on "${elementName}" button`;
        else if (roleType === 'link') displayName = `Click on "${elementName}" link`;
        else displayName = `Click on "${elementName}"`;
      } else {
        displayName = `Click on "${elementName}"`;
      }
      fieldName = elementName;
    } else if (lowerName.includes('locator')) {
      if (lowerName.includes('remixicon') || lowerName.includes('svg') || lowerName.includes('path')) {
        displayName = 'Click on icon';
        fieldName = 'Icon';
      } else if (lowerName.includes('button')) {
        displayName = 'Click on button';
        fieldName = 'Button';
      } else {
        displayName = 'Click on element';
        fieldName = 'Element';
      }
    } else {
      displayName = 'Click on element';
      fieldName = 'Element';
    }
  } else if (lowerName.startsWith('fill')) {
    action = 'Input';
    if (elementName) {
      displayName = `Enter "${extractedValue}" in "${elementName}"`;
      fieldName = elementName;
    } else if (placeholderMatch) {
      displayName = `Enter "${extractedValue}" in "${placeholderMatch[1]}"`;
      fieldName = placeholderMatch[1];
    } else {
      displayName = `Enter "${extractedValue}" in field`;
      fieldName = 'Input Field';
    }
  } else if (lowerName.startsWith('type')) {
    action = 'Input';
    const typeValueMatch = stepName.match(/Type\s+"([^"]+)"/i);
    if (typeValueMatch) {
      extractedValue = typeValueMatch[1];
      displayName = `Type "${extractedValue}"`;
      fieldName = 'Keyboard Input';
    } else {
      displayName = 'Type text';
      fieldName = 'Keyboard Input';
    }
  } else if (lowerName.startsWith('navigate')) {
    action = 'Navigate';
    const urlMatch = stepName.match(/Navigate to\s+"([^"]+)"/i);
    if (urlMatch) {
      const url = urlMatch[1];
      if (url === '/') {
        displayName = 'Navigate to Home page';
        fieldName = 'Home';
      } else if (url === '/plugins') {
        displayName = 'Navigate to Plugins page';
        fieldName = 'Plugins';
      } else if (url === '/studio') {
        displayName = 'Navigate to Studio page';
        fieldName = 'Studio';
      } else {
        displayName = `Navigate to "${url}" page`;
        fieldName = url.replace(/^\//, '').replace(/-/g, ' ') || 'Page';
      }
    } else {
      displayName = 'Navigate to page';
      fieldName = 'Page';
    }
  } else if (lowerName.startsWith('expect')) {
    action = 'Verify';
    if (lowerName.includes('tobevisible')) {
      displayName = 'Verify element is visible';
      fieldName = 'Visibility Check';
    } else if (lowerName.includes('tocontaintext')) {
      displayName = 'Verify text content';
      fieldName = 'Text Verification';
    } else if (lowerName.includes('tobeenabled')) {
      displayName = 'Verify element is enabled';
      fieldName = 'Enabled Check';
    } else {
      displayName = 'Verify condition';
      fieldName = 'Verification';
    }
    extractedValue = 'True';
  } else if (lowerName.startsWith('wait')) {
    action = 'Wait';
    if (lowerName.includes('timeout')) {
      displayName = 'Wait for page to load';
      fieldName = 'Timeout';
    } else if (lowerName.includes('popup')) {
      displayName = 'Wait for popup window';
      fieldName = 'Popup';
    } else if (lowerName.includes('event')) {
      displayName = 'Wait for event';
      fieldName = 'Event';
    } else {
      displayName = 'Wait for element';
      fieldName = 'Wait';
    }
  } else if (lowerName === 'screenshot') {
    action = 'Capture';
    displayName = 'Capture current page state';
    fieldName = 'Screenshot';
  } else if (lowerName === 'reload') {
    action = 'Navigate';
    displayName = 'Reload page';
    fieldName = 'Reload';
  } else if (lowerName.startsWith('close')) {
    action = 'Close';
    if (lowerName.includes('page')) {
      displayName = 'Close page';
      fieldName = 'Page';
    } else {
      displayName = 'Close window';
      fieldName = 'Window';
    }
  } else if (stepName.includes(' - Before') || stepName.includes(' - After') || stepName.includes(' - Url')) {
    action = 'Capture';
    displayName = stepName;
    fieldName = 'Screenshot';
  } else {
    displayName = stepName;
    fieldName = truncateText(stepName, 20);
  }

  return { displayName, fieldName, value: extractedValue, action };
}

function findMatchingWorkflowStep(stepName, stepNumber) {
  if (stepNumber && stepNumber > 0) {
    return { stepNumber, title: stepName };
  }

  const name = stepName.toLowerCase();
  const stepMatch = name.match(/step\s*(\d+)/i);
  if (stepMatch) {
    return { stepNumber: parseInt(stepMatch[1], 10), title: stepName };
  }
  return null;
}

function getActionType(name) {
  if (name.includes('capture') || name.includes('screenshot') || name.includes('page state')) return 'capture';
  if (name.includes('click')) return 'click';
  if (name.includes('fill') || name.includes('input') || name.includes('type') || name.includes('enter value')) return 'fill';
  if (name.includes('navigate') || name.includes('goto') || name.includes('go to')) return 'navigate';
  if (name.includes('expect') || name.includes('verify') || name.includes('assert') || name.includes('check') || name.includes('should') || name.includes('tobevisible') || name.includes('tocontaintext')) return 'verify';
  if (name.includes('wait')) return 'wait';
  if (name.includes('select') || name.includes('choose')) return 'select';
  return 'default';
}

function getHumanizedDescription(stepName, action) {
  const name = stepName.toLowerCase();

  let cleanStepName = stepName
    .replace(/^step\s*\d+\s*[-:]\s*/i, '')
    .replace(/[-_]/g, ' ')
    .trim();

  const cleanStepNameLower = cleanStepName.toLowerCase();
  const prefixes = ['navigate to ', 'click on ', 'click ', 'verify ', 'search ', 'open ', 'configure ', 'create ', 'install ', 'upload ', 'run ', 'publish ', 'execute ', 'select ', 'wait for ', 'enter ', 'fill ', 'capture ', 'add ', 'link '];
  for (const prefix of prefixes) {
    if (cleanStepNameLower.startsWith(prefix)) {
      cleanStepName = cleanStepName.substring(prefix.length).trim();
      break;
    }
  }

  const actionType = getActionType(name);
  let expected = cleanStepName;
  let actual = `${cleanStepName} completed successfully`;
  let verificationPoint = 'Y';
  let logInfo = '';

  switch (actionType) {
    case 'capture':
      expected = `Capture the ${cleanStepName} screenshot`;
      actual = `Captured the ${cleanStepName} screenshot`;
      logInfo = 'The screenshot was successfully created.';
      break;
    case 'click':
      expected = `Click on ${cleanStepName}`;
      actual = `Clicked on ${cleanStepName} successfully`;
      break;
    case 'fill':
      expected = `Enter value in ${cleanStepName}`;
      actual = `Entered value in ${cleanStepName} successfully`;
      break;
    case 'navigate':
      expected = `Navigate to ${cleanStepName}`;
      actual = `Navigated to ${cleanStepName} successfully`;
      logInfo = 'Navigation completed.';
      break;
    case 'verify':
      expected = `Verify ${cleanStepName}`;
      actual = `Verified ${cleanStepName} successfully`;
      logInfo = 'Verification was successful.';
      break;
    case 'wait':
      expected = `Wait for ${cleanStepName}`;
      actual = `Waited for ${cleanStepName} successfully`;
      break;
    case 'select':
      expected = `Select ${cleanStepName}`;
      actual = `Selected ${cleanStepName} successfully`;
      break;
    default:
      if (name.includes('install')) {
        expected = `Install ${cleanStepName}`;
        actual = `Installed ${cleanStepName} successfully`;
        logInfo = 'Installation completed.';
      } else if (name.includes('create')) {
        expected = `Create ${cleanStepName}`;
        actual = `Created ${cleanStepName} successfully`;
        logInfo = 'Creation completed.';
      } else if (name.includes('configure')) {
        expected = `Configure ${cleanStepName}`;
        actual = `Configured ${cleanStepName} successfully`;
        logInfo = 'Configuration completed.';
      } else if (name.includes('add')) {
        expected = `Add ${cleanStepName}`;
        actual = `Added ${cleanStepName} successfully`;
      } else if (name.includes('link')) {
        expected = `Link ${cleanStepName}`;
        actual = `Linked ${cleanStepName} successfully`;
      } else if (name.includes('run')) {
        expected = `Run ${cleanStepName}`;
        actual = `Ran ${cleanStepName} successfully`;
        verificationPoint = 'Y';
        logInfo = 'Execution completed with SUCCESS.';
      } else if (name.includes('publish')) {
        expected = `Publish ${cleanStepName}`;
        actual = `Published ${cleanStepName} successfully`;
        logInfo = 'Publishing completed.';
      } else if (name.includes('execute')) {
        expected = `Execute ${cleanStepName}`;
        actual = `Executed ${cleanStepName} successfully`;
        verificationPoint = 'Y';
        logInfo = 'Execution completed.';
      } else if (name.includes('search')) {
        expected = `Search ${cleanStepName}`;
        actual = `Searched ${cleanStepName} successfully`;
      } else if (name.includes('open')) {
        expected = `Open ${cleanStepName}`;
        actual = `Opened ${cleanStepName} successfully`;
      } else {
        expected = cleanStepName;
        actual = `${cleanStepName} completed successfully`;
      }
      break;
  }

  return { expected, actual, verificationPoint, logInfo };
}

function getFailedDescription(stepName, errorMessage) {
  const name = stepName.toLowerCase();
  let cleanStepName = stepName
    .replace(/^step\s*\d+\s*[-:]\s*/i, '')
    .replace(/[-_]/g, ' ')
    .trim();

  const cleanStepNameLower = cleanStepName.toLowerCase();
  const prefixes = ['navigate to ', 'click on ', 'click ', 'verify ', 'search ', 'open ', 'configure ', 'create ', 'install ', 'upload ', 'run ', 'publish ', 'execute '];
  for (const prefix of prefixes) {
    if (cleanStepNameLower.startsWith(prefix)) {
      cleanStepName = cleanStepName.substring(prefix.length).trim();
      break;
    }
  }

  const logInfo = errorMessage ? truncateText(errorMessage, 100) : 'Step execution failed.';
  const actionType = getActionType(name);
  let expected = cleanStepName;
  let actual = `${cleanStepName} failed`;

  switch (actionType) {
    case 'click':
      expected = `Click on ${cleanStepName}`;
      actual = `Clicked on ${cleanStepName} failed`;
      break;
    case 'fill':
      expected = `Enter value in ${cleanStepName}`;
      actual = `Entered value in ${cleanStepName} failed`;
      break;
    case 'verify':
      expected = `Verify ${cleanStepName}`;
      actual = `Verified ${cleanStepName} failed`;
      break;
    case 'navigate':
      expected = `Navigate to ${cleanStepName}`;
      actual = `Navigated to ${cleanStepName} failed`;
      break;
    case 'wait':
      expected = `Wait for ${cleanStepName}`;
      actual = `Waited for ${cleanStepName} failed`;
      break;
    case 'capture':
      expected = `Capture the ${cleanStepName} screenshot`;
      actual = `Captured the ${cleanStepName} screenshot failed`;
      break;
    case 'select':
      expected = `Select ${cleanStepName}`;
      actual = `Selected ${cleanStepName} failed`;
      break;
    default:
      if (name.includes('install')) {
        expected = `Install ${cleanStepName}`;
        actual = `Installed ${cleanStepName} failed`;
      } else if (name.includes('create')) {
        expected = `Create ${cleanStepName}`;
        actual = `Created ${cleanStepName} failed`;
      } else if (name.includes('configure')) {
        expected = `Configure ${cleanStepName}`;
        actual = `Configured ${cleanStepName} failed`;
      } else if (name.includes('add')) {
        expected = `Add ${cleanStepName}`;
        actual = `Added ${cleanStepName} failed`;
      } else if (name.includes('link')) {
        expected = `Link ${cleanStepName}`;
        actual = `Linked ${cleanStepName} failed`;
      } else if (name.includes('run')) {
        expected = `Run ${cleanStepName}`;
        actual = `Ran ${cleanStepName} failed`;
      } else if (name.includes('publish')) {
        expected = `Publish ${cleanStepName}`;
        actual = `Published ${cleanStepName} failed`;
      } else if (name.includes('execute')) {
        expected = `Execute ${cleanStepName}`;
        actual = `Executed ${cleanStepName} failed`;
      } else if (name.includes('search')) {
        expected = `Search ${cleanStepName}`;
        actual = `Searched ${cleanStepName} failed`;
      } else if (name.includes('open')) {
        expected = `Open ${cleanStepName}`;
        actual = `Opened ${cleanStepName} failed`;
      } else {
        expected = cleanStepName;
        actual = `${cleanStepName} failed`;
      }
      break;
  }

  return { expected, actual, verificationPoint: 'Y', logInfo };
}

console.log('');
console.log('┌───────────────────────────────────────────────────────┐');
console.log('│        TOSCA-STYLE EXECUTION REPORT GENERATOR V24    │');
console.log('│        JSON Reporter → Professional PDF (100% Accuracy) │');
console.log('└───────────────────────────────────────────────────────┘');
console.log('');

if (!fs.existsSync(CONFIG.OUTPUT_DIR)) {
  fs.mkdirSync(CONFIG.OUTPUT_DIR, { recursive: true });
}

console.log('📊 Loading test data from JSON Reporter...');
console.log(`👤 Executed by: ${CONFIG.AUTHOR}`);
console.log(`🌐 Environment: ${CONFIG.ENVIRONMENT}`);
console.log('');

const jsonData = loadJsonReporterData();
const { tests: allTests, stats: testStats } = extractTestsFromJson(jsonData);

console.log(`✅ Loaded ${allTests.length} tests from JSON Reporter`);
console.log(`📄 Spec files: ${new Set(allTests.map(t => t.specFile)).size}`);
console.log(`✅ Passed: ${allTests.filter(t => t.status === 'passed').length}`);
console.log(`❌ Failed: ${allTests.filter(t => t.status === 'failed' || t.status === 'timedOut').length}`);
console.log(`⏭️ Skipped: ${allTests.filter(t => t.status === 'skipped').length}`);
console.log('');

const testResults = allTests.map((test) => {
  const screenshotMap = new Map();
  let failureScreenshot = null;

  if (test.attachments && test.attachments.length > 0) {
    test.attachments.forEach(att => {
      if (att.contentType?.includes('image') && att.path && att.name) {
        const attNameLower = att.name.toLowerCase();
        if (attNameLower === 'screenshot' && !failureScreenshot) {
          failureScreenshot = att.path;
          return;
        }
        const skipNames = ['video', 'trace', 'error-context'];
        if (!skipNames.includes(attNameLower)) {
          const key = attNameLower;
          if (!screenshotMap.has(key)) screenshotMap.set(key, []);
          screenshotMap.get(key).push(att.path);
        }
      }
    });
  }

  const formattedSteps = (test.steps || []).map((step, stepIndex) => {
    const stepTitle = step.title || 'Unnamed Step';
    const stepTitleLower = stepTitle.toLowerCase();
    const stepScreenshots = [];

    screenshotMap.forEach((paths, attName) => {
      const attNameParts = attName.split(' - ');
      const attLastPart = attNameParts[attNameParts.length - 1];
      const stepTitleParts = stepTitleLower.split(' - ');
      const stepLastPart = stepTitleParts[stepTitleParts.length - 1];

      if (
        attName.includes(stepTitleLower) ||
        stepTitleLower.includes(attLastPart) ||
        attLastPart.includes(stepLastPart) ||
        stepLastPart.includes(attLastPart)
      ) {
        stepScreenshots.push(...paths);
      }
    });

    const isFailed = !!step.error;
    if (isFailed && stepScreenshots.length === 0 && failureScreenshot) {
      stepScreenshots.push(failureScreenshot);
    }

    return {
      number: stepIndex + 1,
      name: stepTitle,
      status: step.error ? 'failed' : 'passed',
      duration: step.duration || 0,
      screenshots: stepScreenshots,
      source: 'json-reporter',
      error: step.error ? {
        message: step.error.message || '',
        stack: step.error.stack || '',
        snippet: step.error.snippet || '',
        location: step.error.location || null
      } : null,
      attachments: step.attachments || [],
      stepNumber: step.stepNumber || step.number || null,
      statusDetails: step.statusDetails || null,
      steps: step.steps || []
    };
  });

  if (test.errors && test.errors.length > 0 && formattedSteps.length === 0) {
    const testError = test.errors[0];
    let snippet = '';
    const message = testError.message || '';
    const parts = message.split('\n\n');
    if (parts.length > 1) {
      for (let i = 1; i < parts.length; i++) {
        if (parts[i].includes('\u001b[') || parts[i].includes(' | ') || parts[i].includes('|')) {
          snippet = parts[i];
          const stackStart = snippet.indexOf('\n\u001b[2m   at ');
          if (stackStart > 0) snippet = snippet.substring(0, stackStart);
          break;
        }
      }
    }

    const syntheticScreenshots = [];
    if (test.attachments && test.attachments.length > 0) {
      test.attachments.forEach(att => {
        if (att.contentType?.includes('image') && att.path && att.name) {
          const skipNames = ['screenshot', 'video', 'trace', 'error-context'];
          if (!skipNames.includes(att.name.toLowerCase())) syntheticScreenshots.push(att.path);
        }
      });
    }

    formattedSteps.push({
      number: 1,
      name: 'Test Execution Error',
      status: 'failed',
      duration: test.duration || 0,
      screenshots: syntheticScreenshots,
      source: 'json-reporter',
      error: {
        message: testError.message || '',
        stack: testError.stack || '',
        snippet: snippet.trim(),
        location: testError.location || null
      }
    });
  }

  return {
    name: test.testName,
    nameSource: 'json-reporter',
    specFile: test.specFile.replace(/\\/g, '/'),
    specFileSource: 'json-reporter',
    status: test.status,
    statusSource: 'json-reporter',
    start: test.startTime ? test.startTime.getTime() : Date.now(),
    stop: test.startTime ? test.startTime.getTime() + test.duration : Date.now() + test.duration,
    steps: formattedSteps,
    stepsSource: 'json-reporter',
    errorMessage: test.errors.length > 0 ? test.errors[0].message : '',
    failedScreenshotPath: null,
    labels: test.labels || [],
    statusDetails: test.errors.length > 0 ? { message: test.errors[0].message } : null,
    testNameSource: 'trace'
  };
});

console.log('');
console.log('📋 Test Results Summary:');
console.log(`   Total Tests: ${testResults.length}`);
console.log(`   ✅ Passed: ${testResults.filter(t => t.status === 'passed').length}`);
console.log(`   ❌ Failed: ${testResults.filter(t => t.status === 'failed' || t.status === 'timedOut').length}`);
console.log(`   ⏭️ Skipped: ${testResults.filter(t => t.status === 'skipped').length}`);
console.log('   📊 Data Source: JSON Reporter (100% accuracy matching HTML report)');
console.log('');

const analysis = {
  total: testResults.length,
  passed: testResults.filter(t => t.status === 'passed'),
  failed: testResults.filter(t => t.status === 'failed' || t.status === 'timedOut'),
  broken: [],
  skipped: [],
  get executed() { return this.total; },
  get failedCount() { return this.failed.length; },
  get totalDuration() { return testStats.duration || 0; },
  get passRate() {
    return this.executed === 0 ? 0 : ((this.passed.length / this.executed) * 100).toFixed(1);
  },
  get overallResult() {
    return this.failed.length > 0 ? 'Failed' : 'Passed';
  },
  startTime: new Date(),
  endTime: new Date()
};

console.log('');
console.log(`✅ Passed: ${analysis.passed.length}`);
console.log(`❌ Failed: ${analysis.failedCount}`);
console.log(`📊 Pass Rate: ${analysis.passRate}%`);
console.log('');
console.log('📄 Generating Playwright Enterprise GenAI Platform Tests Execution Report...');

const doc = new PDFDocument({
  size: 'A4',
  margins: CONFIG.PAGE.MARGIN,
  bufferPages: true,
  info: {
    Title: 'Playwright Enterprise GenAI Platform Tests Execution Report',
    Author: CONFIG.AUTHOR,
    Url: CONFIG.URL_PATH,
    Subject: `${CONFIG.PROJECT_NAME} Test Execution Results`
  }
});

const stream = fs.createWriteStream(OUTPUT_FILE);
doc.pipe(stream);

let pageNumber = 0;

function addPageFooter() {
  doc.save();
  const footerY = CONFIG.PAGE.HEIGHT - 35;
  doc.moveTo(LEFT, footerY).lineTo(RIGHT, footerY)
    .strokeColor(COLORS.borderLight).lineWidth(0.5).stroke();
  doc.fontSize(8).font('Helvetica').fillColor(COLORS.textLight)
    .text(`Page ${pageNumber}`, LEFT, footerY + 8, { width: CONTENT_WIDTH, align: 'center' });
  doc.fontSize(7).fillColor(COLORS.textMuted)
    .text(`Generated: ${formatDateTime(timestamp)}`, LEFT, footerY + 8)
    .text('Confidential', LEFT, footerY + 8, { width: CONTENT_WIDTH, align: 'right' });
  doc.restore();
}

function newPage() {
  if (pageNumber > 0) {
    addPageFooter();
    doc.addPage();
  }
  pageNumber++;
  doc.y = CONFIG.PAGE.MARGIN.TOP;
}

function checkPageBreak(requiredHeight = 100) {
  const availableSpace = CONFIG.PAGE.HEIGHT - CONFIG.PAGE.MARGIN.BOTTOM - 40 - doc.y;
  if (requiredHeight > availableSpace) {
    newPage();
    return doc.y;
  }
  return doc.y;
}

function drawPlayIcon(x, y, size, color) {
  doc.save();
  doc.fillColor(color);
  doc.moveTo(x, y).lineTo(x + size, y + size / 2).lineTo(x, y + size).closePath().fill();
  doc.restore();
}

function drawCheckmark(x, y, size, color) {
  doc.save();
  doc.strokeColor(color).lineWidth(2);
  doc.moveTo(x, y + size * 0.5).lineTo(x + size * 0.35, y + size * 0.8).lineTo(x + size, y + size * 0.2).stroke();
  doc.restore();
}

function drawXIcon(x, y, size, color) {
  doc.save();
  doc.strokeColor(color).lineWidth(2);
  doc.moveTo(x, y).lineTo(x + size, y + size).stroke();
  doc.moveTo(x + size, y).lineTo(x, y + size).stroke();
  doc.restore();
}

function drawChevronDown(x, y, size, color) {
  doc.save();
  doc.strokeColor(color).lineWidth(1.5);
  doc.moveTo(x, y).lineTo(x + size / 2, y + size * 0.6).lineTo(x + size, y).stroke();
  doc.restore();
}

function drawCell(x, y, width, height, text, options = {}) {
  const {
    bgColor = COLORS.rowWhite,
    textColor = COLORS.text,
    borderColor = COLORS.tableBorder,
    fontSize = 9,
    fontStyle = 'Helvetica',
    align = 'left',
    padding = 5
  } = options;

  doc.save();
  doc.rect(x, y, width, height).fillColor(bgColor).fill();
  doc.rect(x, y, width, height).strokeColor(borderColor).lineWidth(0.5).stroke();

  if (text !== undefined && text !== null) {
    doc.fontSize(fontSize).font(fontStyle).fillColor(textColor);
    const textY = y + (height - fontSize) / 2;
    doc.text(String(text), x + padding, textY, { width: width - padding * 2, align, lineBreak: false });
  }

  doc.restore();
}

function drawTestCaseTitle(testName, y, testNameSource = 'trace') {
  doc.save();
  const textWidth = CONTENT_WIDTH - 26;
  const textHeight = doc.heightOfString(testName, { width: textWidth, lineBreak: true });
  const totalHeight = Math.max(22, textHeight + 16);

  const isFallback = testNameSource === 'subdir' || testNameSource === 'attachments';
  if (isFallback) {
    doc.rect(LEFT, y, CONTENT_WIDTH, totalHeight).fillColor('#FFFF00').fill();
    doc.rect(LEFT, y, CONTENT_WIDTH, totalHeight).strokeColor(COLORS.borderLight).lineWidth(0.5).stroke();
  }

  drawPlayIcon(LEFT, y + 7, 16, COLORS.teal);
  doc.fontSize(14).font('Helvetica-Bold').fillColor(COLORS.primaryDark)
    .text(testName, LEFT + 26, y + 8, { width: textWidth, lineBreak: true });

  doc.restore();
  return y + totalHeight + 8;
}

function drawEnvironmentRow(y) {
  doc.save();
  doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text).text('Environment:', LEFT, y + 5);
  doc.font('Helvetica').fillColor(COLORS.green).text(CONFIG.ENVIRONMENT, LEFT + 80, y + 5);
  doc.font('Helvetica-Bold').fillColor(COLORS.text).text('Test Phase:', LEFT + 150, y + 5);
  doc.font('Helvetica').fillColor(COLORS.blue).text(CONFIG.TEST_PHASE, LEFT + 230, y + 5);
  doc.restore();
  return y + 22;
}

function drawTestCaseBox(testName, status, y, testNameSource = 'trace') {
  const boxHeight = 35;
  const statusColor = getStatusColor(status);
  const statusText = getStatusText(status);
  const isPassed = status === 'passed';
  const isFallback = testNameSource === 'subdir' || testNameSource === 'attachments';
  const bgColor = isFallback ? '#FFFF00' : COLORS.lightGray;

  doc.save();
  doc.rect(LEFT, y, CONTENT_WIDTH, boxHeight).fillColor(bgColor).fill();
  doc.rect(LEFT, y, CONTENT_WIDTH, boxHeight).strokeColor(COLORS.borderLight).lineWidth(1).stroke();

  const iconX = LEFT + 10, iconY = y + 10, iconSize = 14;
  if (isPassed) {
    doc.circle(iconX + iconSize / 2, iconY + iconSize / 2, iconSize / 2 + 3).fillColor(COLORS.passed).fill();
    drawCheckmark(iconX, iconY, iconSize, COLORS.white);
  } else {
    doc.circle(iconX + iconSize / 2, iconY + iconSize / 2, iconSize / 2 + 3).fillColor(COLORS.failed).fill();
    drawXIcon(iconX + 2, iconY + 2, iconSize - 4, COLORS.white);
  }

  const badgeWidth = 70, badgeHeight = 20;
  const badgeX = RIGHT - badgeWidth - 10, badgeY = y + (boxHeight - badgeHeight) / 2;

  doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text)
    .text(testName, LEFT + 40, y + 11, { width: RIGHT - badgeWidth - LEFT - 50, lineBreak: true });
  doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 3).fillColor(statusColor).fill();
  doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.white)
    .text(statusText, badgeX, badgeY + 5, { width: badgeWidth, align: 'center' });

  doc.restore();
  return y + boxHeight + 5;
}

function drawTestObjective(objective, y) {
  doc.save();
  doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.textDark).text('Playwright Test Objective', LEFT, y);
  doc.fontSize(9).font('Helvetica').fillColor(COLORS.text)
    .text(objective || 'Automated test execution via Playwright', LEFT, y + 18, { width: CONTENT_WIDTH });
  doc.restore();
  return y + 43;
}

function drawMetadataGrid(test, y) {
  const rowHeight = 18;
  const col1Width = 115, col2Width = 150, col3Width = 100;
  const col4Width = CONTENT_WIDTH - col1Width - col2Width - col3Width;

  const startTime = test.start ? new Date(test.start) : new Date();
  const endTime = test.stop ? new Date(test.stop) : new Date();

  const metadata = [
    ['Started:', formatDateTime(startTime), 'Executed by', CONFIG.AUTHOR.split(',')[0]],
    ['Ended:', formatDateTime(endTime), 'System ID', '54312'],
    ['Author:', CONFIG.AUTHOR.split(',')[0], 'System Name:', 'Enterprise GenAI Platform'],
    ['Spec File:', test.specFile || 'Unknown', '', '']
  ];

  let currentY = y;
  metadata.forEach((row, index) => {
    const bgColor = index % 2 === 0 ? COLORS.rowWhite : COLORS.rowAlt;
    drawCell(LEFT, currentY, col1Width, rowHeight, row[0], { bgColor, textColor: COLORS.cellBg, fontStyle: 'Helvetica-Bold', fontSize: 8 });
    if (row[0] === 'Spec File:') {
      drawCell(LEFT + col1Width, currentY, col2Width + col3Width + col4Width, rowHeight, row[1], { bgColor, fontSize: 8 });
    } else {
      drawCell(LEFT + col1Width, currentY, col2Width, rowHeight, row[1], { bgColor, fontSize: 8 });
      drawCell(LEFT + col1Width + col2Width, currentY, col3Width, rowHeight, row[2], { bgColor, textColor: COLORS.cellBg, fontStyle: 'Helvetica-Bold', fontSize: 8 });
      drawCell(LEFT + col1Width + col2Width + col3Width, currentY, col4Width, rowHeight, row[3], { bgColor, fontSize: 8 });
    }
    currentY += rowHeight;
  });
  return currentY + 10;
}

function drawStepTableHeader(y) {
  const headerHeight = 22;
  doc.save();
  doc.rect(LEFT, y, CONTENT_WIDTH, headerHeight).fillColor(COLORS.headerBg).fill();
  doc.rect(LEFT, y, CONTENT_WIDTH, headerHeight).strokeColor(COLORS.border).lineWidth(0.5).stroke();
  doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.white)
    .text('Step Name', LEFT + 25, y + 6, { width: CONTENT_WIDTH - 30 });
  doc.restore();
  return y + headerHeight;
}

function drawTestStepDescriptionHeader(stepName, stepNumber, y) {
  const headerHeight = 24;
  doc.save();
  doc.rect(LEFT, y, CONTENT_WIDTH, headerHeight).fillColor(COLORS.headerBg).fill();
  doc.rect(LEFT, y, CONTENT_WIDTH, headerHeight).strokeColor(COLORS.border).lineWidth(0.5).stroke();
  const headerText = `Test Step Description: Step ${stepNumber} - ${stepName}`;
  doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.white)
    .text(truncateText(headerText, 85), LEFT + 10, y + 6, { width: CONTENT_WIDTH - 20 });
  doc.restore();
  return y + headerHeight + 2;
}

function drawStepRow(stepName, value, action, status, logInfo, y, isAlternate, depth = 0, stepNumber = '') {
  const bgColor = isAlternate ? COLORS.rowAlt : COLORS.rowWhite;
  const statusColor = getStatusColor(status);
  const indent = depth * 15;
  const displayName = stepNumber ? `Step ${stepNumber} : ${stepName}` : stepName;

  const textWidth = CONTENT_WIDTH - 25 - indent;
  doc.fontSize(8).font('Helvetica');
  const textHeight = doc.heightOfString(displayName, { width: textWidth });
  const rowHeight = Math.max(20, textHeight + 10);

  doc.save();
  doc.rect(LEFT, y, CONTENT_WIDTH, rowHeight).fillColor(bgColor).fill();
  doc.rect(LEFT, y, CONTENT_WIDTH, rowHeight).strokeColor(COLORS.tableBorder).lineWidth(0.5).stroke();

  const iconSize = 8;
  const iconX = LEFT + 4 + indent;
  const iconY = y + 6;
  if (status === 'passed') drawCheckmark(iconX, iconY, iconSize, COLORS.passed);
  else drawXIcon(iconX, iconY, iconSize, COLORS.failed);

  doc.fontSize(8).font('Helvetica').fillColor(COLORS.text)
    .text(displayName, LEFT + 18 + indent, y + 6, { width: textWidth });
  doc.restore();

  return y + rowHeight;
}

function drawDetailRow(label, value, status, y) {
  const valueText = value || 'N/A';
  const valueWidth = CONTENT_WIDTH - 170;

  doc.fontSize(8).font('Helvetica');
  const textHeight = doc.heightOfString(valueText, { width: valueWidth });
  const rowHeight = Math.max(18, textHeight + 8);

  doc.save();
  doc.rect(LEFT + 20, y, CONTENT_WIDTH - 20, rowHeight).fillColor(COLORS.lightGray).fill();
  doc.rect(LEFT + 20, y, CONTENT_WIDTH - 20, rowHeight).strokeColor(COLORS.tableBorder).lineWidth(0.5).stroke();

  doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.textDark).text(label, LEFT + 25, y + 4, { width: 120 });
  doc.font('Helvetica').fillColor(COLORS.text).text(valueText, LEFT + 145, y + 4, { width: valueWidth });
  doc.restore();

  return y + rowHeight;
}

function drawSubStepTableRow(fieldName, value, action, status, y, isAlternate = false) {
  const textWidth = CONTENT_WIDTH - 50;
  const displayText = value ? `${fieldName}: ${value}` : fieldName;

  doc.fontSize(8).font('Helvetica');
  const textHeight = doc.heightOfString(displayText, { width: textWidth });
  const rowHeight = Math.max(20, textHeight + 10);

  const bgColor = isAlternate ? COLORS.rowAlt : COLORS.rowWhite;
  const statusColor = getStatusColor(status);

  doc.save();
  doc.rect(LEFT + 20, y, CONTENT_WIDTH - 20, rowHeight).fillColor(bgColor).fill();
  doc.rect(LEFT + 20, y, CONTENT_WIDTH - 20, rowHeight).strokeColor(COLORS.tableBorder).lineWidth(0.5).stroke();

  const iconSize = 8;
  const iconX = LEFT + 25;
  const iconY = y + (rowHeight - iconSize) / 2;
  if (status === 'passed') drawCheckmark(iconX, iconY, iconSize, COLORS.passed);
  else drawXIcon(iconX, iconY, iconSize, COLORS.failed);

  doc.fontSize(8).font('Helvetica').fillColor(COLORS.text)
    .text(displayText, LEFT + 40, y + 5, { width: textWidth });

  doc.restore();
  return y + rowHeight;
}

function parseStepForSubDetails(stepName) {
  const name = stepName.toLowerCase();
  let fieldName = stepName;
  let value = '';
  let action = 'Verify';

  const fillMatch = stepName.match(/fill\s+["']?([^"']+)["']?\s+with\s+["']?([^"']+)["']?/i);
  if (fillMatch) {
    fieldName = fillMatch[1];
    value = fillMatch[2];
    action = 'Input';
    return { fieldName, value, action };
  }

  const clickMatch = stepName.match(/click\s+(?:on\s+)?["']?([^"']+)["']?/i);
  if (clickMatch) {
    fieldName = clickMatch[1];
    action = 'Click';
    return { fieldName, value: '', action };
  }

  if (name.includes('select')) {
    fieldName = stepName.replace(/select/i, '').trim();
    action = 'Select';
    return { fieldName, value: '', action };
  }

  if (name.includes('expect') || name.includes('verify') || name.includes('assert') || name.includes('should')) {
    action = 'Verify';
    return { fieldName: stepName, value: 'True', action };
  }

  if (name.includes('navigate') || name.includes('goto')) {
    fieldName = 'Navigation';
    action = 'Navigate';
    return { fieldName, value: '', action };
  }

  if (name.includes('click')) action = 'Click';
  else if (name.includes('fill') || name.includes('input') || name.includes('type')) action = 'Input';
  else if (name.includes('select')) action = 'Select';
  else action = 'Verify';

  return { fieldName: stepName, value, action };
}

function drawErrorBox(message, y) {
  const padding = 8;
  const maxWidth = CONTENT_WIDTH - 40;

  doc.fontSize(8);
  const textHeight = Math.min(doc.heightOfString(message || '', { width: maxWidth - padding * 2 }), 100);
  const boxHeight = textHeight + padding * 2;

  doc.save();
  doc.rect(LEFT + 20, y, maxWidth, boxHeight).fillColor(COLORS.errorBg).fill();
  doc.rect(LEFT + 20, y, maxWidth, boxHeight).strokeColor(COLORS.failed).lineWidth(1).stroke();
  doc.fontSize(12).font('Helvetica-Bold').fillColor(COLORS.failed).text('!', LEFT + 28, y + padding);
  doc.fontSize(8).font('Helvetica').fillColor(COLORS.failed)
    .text((message || 'Unknown error').substring(0, 500), LEFT + 45, y + padding, { width: maxWidth - 35, height: 100, ellipsis: true });
  doc.restore();

  return y + boxHeight + 10;
}

function drawCodeSnippet(snippet, location, y) {
  if (!snippet) return y;

  const padding = 8;
  const maxWidth = CONTENT_WIDTH - 40;

  const cleanSnippet = snippet.replace(/\u001b\[\d+m/g, '');

  doc.save();
  doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.failed);
  let header = 'Code Snippet:';
  if (location) {
    let filePath = location.file;
    const projectMatch = filePath.match(/GAINTestAutomationPlaywright[\\/](.+)$/);
    if (projectMatch) filePath = projectMatch[1].replace(/\\/g, '/');
    header = `Error at ${filePath}:${location.line}:${location.column}`;
  }

  const headerWidth = doc.widthOfString(header);
  const headerHeight = doc.currentLineHeight();
  doc.rect(LEFT + 20, y, headerWidth + 10, headerHeight + 4).fillColor('#FFFF00').fill();
  doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.failed).text(header, LEFT + 20, y);
  doc.restore();

  y += 18;

  doc.fontSize(7).font('Courier');
  const textHeight = Math.min(doc.heightOfString(cleanSnippet, { width: maxWidth - padding * 2 }), 150);
  const boxHeight = textHeight + padding * 2;

  doc.save();
  doc.rect(LEFT + 20, y, maxWidth, boxHeight).fillColor('#F5F5F5').fill();
  doc.rect(LEFT + 20, y, maxWidth, boxHeight).strokeColor('#CCCCCC').lineWidth(1).stroke();
  doc.fontSize(7).font('Courier').fillColor('#333333')
    .text(cleanSnippet, LEFT + 20 + padding, y + padding, {
      width: maxWidth - padding * 2,
      height: 150,
      ellipsis: true,
      lineBreak: true
    });
  doc.restore();

  return y + boxHeight + 10;
}

function drawScreenshot(screenshotPath, label, y) {
  let finalPath = screenshotPath;

  if (!fs.existsSync(finalPath)) {
    const testResultsPath = path.join(CONFIG.TEST_RESULTS_DIR, path.basename(screenshotPath));
    if (fs.existsSync(testResultsPath)) finalPath = testResultsPath;
    else return y;
  }

  try {
    const maxWidth = CONTENT_WIDTH - 60;
    const maxHeight = 200;
    const img = doc.openImage(finalPath);
    const aspectRatio = img.height / img.width;

    let imgWidth = Math.min(img.width, maxWidth);
    let imgHeight = imgWidth * aspectRatio;
    if (imgHeight > maxHeight) {
      imgHeight = maxHeight;
      imgWidth = imgHeight / aspectRatio;
    }

    let stepName = label || 'Screenshot Capture';
    let timestampVal = '';
    let url = '';
    let pathSteps = '';

    const timestampMatch = label ? label.match(/Timestamp:\s*([^\-]+?)(?:\s*-\s*Url:|$)/i) : null;
    if (timestampMatch) timestampVal = timestampMatch[1].trim();

    const urlMatch = label ? label.match(/Url:\s*\(([^)]+)\)(?:\s*-\s*Path:|$)/i) : null;
    if (urlMatch) url = urlMatch[1].trim();

    const pathMatch = label ? label.match(/Path:\s*\(([^)]+)\)/i) : null;
    if (pathMatch) pathSteps = pathMatch[1].trim();

    if (label && label.includes('Timestamp:')) {
      stepName = label.split(' - Timestamp:')[0].trim();
      if (stepName.includes(' - ')) {
        const parts = stepName.split(' - ');
        stepName = parts[parts.length - 1].trim();
      }
    }

    const rowHeight = 18;
    const numRows = pathSteps ? 4 : (timestampVal || url ? 3 : 1);
    const tableHeight = rowHeight * numRows;
    y = checkPageBreak(tableHeight + imgHeight + 25);

    doc.save();

    if (timestampVal || url) {
      const tableX = LEFT + 30;
      const tableWidth = CONTENT_WIDTH - 60;
      const labelColWidth = 80;
      const valueColWidth = tableWidth - labelColWidth;

      doc.rect(tableX, y, labelColWidth, rowHeight).fillColor(COLORS.headerBg).fill();
      doc.rect(tableX, y, labelColWidth, rowHeight).strokeColor(COLORS.border).lineWidth(0.5).stroke();
      doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.white).text('Screenshot:', tableX + 5, y + 5);
      doc.rect(tableX + labelColWidth, y, valueColWidth, rowHeight).fillColor(COLORS.rowWhite).fill();
      doc.rect(tableX + labelColWidth, y, valueColWidth, rowHeight).strokeColor(COLORS.border).lineWidth(0.5).stroke();
      doc.fontSize(8).font('Helvetica').fillColor(COLORS.text).text(truncateText(stepName, 75), tableX + labelColWidth + 5, y + 5, { width: valueColWidth - 10 });

      const row2Y = y + rowHeight;
      doc.rect(tableX, row2Y, labelColWidth, rowHeight).fillColor(COLORS.headerBg).fill();
      doc.rect(tableX, row2Y, labelColWidth, rowHeight).strokeColor(COLORS.border).lineWidth(0.5).stroke();
      doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.white).text('Captured On:', tableX + 5, row2Y + 5);
      doc.rect(tableX + labelColWidth, row2Y, valueColWidth, rowHeight).fillColor(COLORS.rowWhite).fill();
      doc.rect(tableX + labelColWidth, row2Y, valueColWidth, rowHeight).strokeColor(COLORS.border).lineWidth(0.5).stroke();
      doc.fontSize(8).font('Helvetica').fillColor(COLORS.text).text(timestampVal || 'N/A', tableX + labelColWidth + 5, row2Y + 5, { width: valueColWidth - 10 });

      const row3Y = y + rowHeight * 2;
      doc.rect(tableX, row3Y, labelColWidth, rowHeight).fillColor(COLORS.headerBg).fill();
      doc.rect(tableX, row3Y, labelColWidth, rowHeight).strokeColor(COLORS.border).lineWidth(0.5).stroke();
      doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.white).text('URL:', tableX + 5, row3Y + 5);
      doc.rect(tableX + labelColWidth, row3Y, valueColWidth, rowHeight).fillColor(COLORS.rowWhite).fill();
      doc.rect(tableX + labelColWidth, row3Y, valueColWidth, rowHeight).strokeColor(COLORS.border).lineWidth(0.5).stroke();
      doc.fontSize(8).font('Helvetica').fillColor(COLORS.blue).text(truncateText(url || 'N/A', 85), tableX + labelColWidth + 5, row3Y + 5, { width: valueColWidth - 10 });

      if (pathSteps) {
        const row4Y = y + rowHeight * 3;
        doc.rect(tableX, row4Y, labelColWidth, rowHeight).fillColor(COLORS.headerBg).fill();
        doc.rect(tableX, row4Y, labelColWidth, rowHeight).strokeColor(COLORS.border).lineWidth(0.5).stroke();
        doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.white).text('Path:', tableX + 5, row4Y + 5);
        doc.rect(tableX + labelColWidth, row4Y, valueColWidth, rowHeight).fillColor(COLORS.rowWhite).fill();
        doc.rect(tableX + labelColWidth, row4Y, valueColWidth, rowHeight).strokeColor(COLORS.border).lineWidth(0.5).stroke();
        doc.fontSize(8).font('Helvetica').fillColor(COLORS.teal || COLORS.text).text(truncateText(pathSteps, 85), tableX + labelColWidth + 5, row4Y + 5, { width: valueColWidth - 10 });
      }
    } else {
      doc.rect(LEFT + 30, y, CONTENT_WIDTH - 60, 18).fillColor(COLORS.cellBg).fill();
      doc.rect(LEFT + 30, y, CONTENT_WIDTH - 60, 18).strokeColor(COLORS.borderLight).lineWidth(0.5).stroke();
      doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.textDark).text(`Screenshot: ${stepName}`, LEFT + 35, y + 4);
    }

    const imgX = LEFT + 30 + (CONTENT_WIDTH - 60 - imgWidth) / 2;
    const imgY = y + tableHeight + 12;
    doc.rect(imgX - 1, imgY - 1, imgWidth + 2, imgHeight + 2).strokeColor(COLORS.borderMedium).lineWidth(1).stroke();
    doc.image(finalPath, imgX, imgY, { width: imgWidth, height: imgHeight });
    doc.restore();

    return imgY + imgHeight + 15;
  } catch (err) {
    console.error(`❌ Screenshot error: ${err.message}`);
    return y;
  }
}

// Cover page
newPage();
const sidebarWidth = 120;
const sidebarColor = '#8B9A46';
doc.save();
doc.rect(0, 0, sidebarWidth, CONFIG.PAGE.HEIGHT).fillColor(sidebarColor).fill();
const playIconX = 35;
const playIconY = 180;
const playIconSize = 50;
doc.fillColor(COLORS.white);
doc.moveTo(playIconX, playIconY)
  .lineTo(playIconX + playIconSize, playIconY + playIconSize / 2)
  .lineTo(playIconX, playIconY + playIconSize)
  .closePath()
  .fill();
doc.restore();

const coverContentX = sidebarWidth + 40;
const coverContentWidth = CONFIG.PAGE.WIDTH - coverContentX - CONFIG.PAGE.MARGIN.RIGHT;

doc.save();
doc.fontSize(36).font('Helvetica-Bold').fillColor('#5D6B2D').text('Execution Test', coverContentX, 200);
doc.fontSize(28).font('Helvetica').fillColor(sidebarColor).text('Report', coverContentX, 245);
const metadataY = 290;
const dateStr = timestamp.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
const timeStr = timestamp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
doc.fontSize(11).font('Helvetica').fillColor('#5D6B2D').text(`Generated on ${dateStr} ${timeStr}`, coverContentX, metadataY);
doc.fontSize(11).font('Helvetica-Oblique').fillColor(sidebarColor).text('System Name : Enterprise GenAI Platform', coverContentX, metadataY + 18);
doc.fontSize(11).font('Helvetica-Oblique').fillColor(sidebarColor).text(`Report Version : ${CONFIG.REPORT_VERSION}`, coverContentX, metadataY + 36);
doc.fontSize(11).font('Helvetica-Oblique').fillColor(sidebarColor).text(`by ${CONFIG.AUTHOR.split(',')[0]}`, coverContentX, metadataY + 54);
doc.restore();

// Page 2 summary
newPage();
doc.save();
doc.fontSize(28).font('Helvetica-Oblique').fillColor(COLORS.text)
  .text('Execution Summary', LEFT, doc.y + 30, { width: CONTENT_WIDTH, align: 'center' });
doc.restore();
doc.y += 80;

const summaryTableWidth = 380;
const summaryTableX = LEFT + (CONTENT_WIDTH - summaryTableWidth) / 2;
const summaryColNum = 30;
const summaryCol1 = 130, summaryCol2 = 120, summaryCol3 = 100;
const summaryRowH = 24;
let sumY = doc.y;

doc.save();
doc.rect(summaryTableX, sumY, summaryColNum + summaryCol1, summaryRowH).fillColor(COLORS.cellBg).fill();
doc.rect(summaryTableX, sumY, summaryColNum + summaryCol1, summaryRowH).strokeColor(COLORS.border).lineWidth(0.5).stroke();
doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text).text('TestCases total', summaryTableX + 5, sumY + 7);
doc.rect(summaryTableX + summaryColNum + summaryCol1, sumY, summaryCol2, summaryRowH).fillColor(COLORS.rowWhite).fill();
doc.rect(summaryTableX + summaryColNum + summaryCol1, sumY, summaryCol2, summaryRowH).strokeColor(COLORS.border).lineWidth(0.5).stroke();
doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text).text(String(analysis.total), summaryTableX + summaryColNum + summaryCol1 + 5, sumY + 7, { width: summaryCol2 - 10, align: 'center' });
doc.rect(summaryTableX + summaryColNum + summaryCol1 + summaryCol2, sumY, summaryCol3, summaryRowH).fillColor(COLORS.rowWhite).fill();
doc.rect(summaryTableX + summaryColNum + summaryCol1 + summaryCol2, sumY, summaryCol3, summaryRowH).strokeColor(COLORS.border).lineWidth(0.5).stroke();
doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text).text('100 %', summaryTableX + summaryColNum + summaryCol1 + summaryCol2 + 5, sumY + 7, { width: summaryCol3 - 10, align: 'center' });
doc.restore();

sumY += summaryRowH;
doc.save();
doc.rect(summaryTableX, sumY, summaryColNum + summaryCol1, summaryRowH).fillColor(COLORS.rowWhite).fill();
doc.rect(summaryTableX, sumY, summaryColNum + summaryCol1, summaryRowH).strokeColor(COLORS.border).lineWidth(0.5).stroke();
doc.fontSize(10).font('Helvetica').fillColor(COLORS.passed).text('Passed', summaryTableX + 20, sumY + 7);
doc.rect(summaryTableX + summaryColNum + summaryCol1, sumY, summaryCol2, summaryRowH).fillColor(COLORS.rowWhite).fill();
doc.rect(summaryTableX + summaryColNum + summaryCol1, sumY, summaryCol2, summaryRowH).strokeColor(COLORS.border).lineWidth(0.5).stroke();
doc.fontSize(10).font('Helvetica').fillColor(COLORS.text).text(String(analysis.passed.length), summaryTableX + summaryColNum + summaryCol1 + 5, sumY + 7, { width: summaryCol2 - 10, align: 'center' });
doc.rect(summaryTableX + summaryColNum + summaryCol1 + summaryCol2, sumY, summaryCol3, summaryRowH).fillColor(COLORS.rowWhite).fill();
doc.rect(summaryTableX + summaryColNum + summaryCol1 + summaryCol2, sumY, summaryCol3, summaryRowH).strokeColor(COLORS.border).lineWidth(0.5).stroke();
doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.passed).text(`${analysis.passRate}%`, summaryTableX + summaryColNum + summaryCol1 + summaryCol2 + 5, sumY + 7, { width: summaryCol3 - 10, align: 'center' });
doc.restore();

if (analysis.failedCount > 0) {
  sumY += summaryRowH;
  doc.save();
  doc.rect(summaryTableX, sumY, summaryColNum + summaryCol1, summaryRowH).fillColor(COLORS.rowWhite).fill();
  doc.rect(summaryTableX, sumY, summaryColNum + summaryCol1, summaryRowH).strokeColor(COLORS.border).lineWidth(0.5).stroke();
  doc.fontSize(10).font('Helvetica').fillColor(COLORS.failed).text('Failed', summaryTableX + 20, sumY + 7);
  doc.rect(summaryTableX + summaryColNum + summaryCol1, sumY, summaryCol2, summaryRowH).fillColor(COLORS.rowWhite).fill();
  doc.rect(summaryTableX + summaryColNum + summaryCol1, sumY, summaryCol2, summaryRowH).strokeColor(COLORS.border).lineWidth(0.5).stroke();
  doc.fontSize(10).font('Helvetica').fillColor(COLORS.text).text(String(analysis.failedCount), summaryTableX + summaryColNum + summaryCol1 + 5, sumY + 7, { width: summaryCol2 - 10, align: 'center' });
  const failRate = analysis.executed > 0 ? ((analysis.failedCount / analysis.executed) * 100).toFixed(1) : '0.0';
  doc.rect(summaryTableX + summaryColNum + summaryCol1 + summaryCol2, sumY, summaryCol3, summaryRowH).fillColor(COLORS.rowWhite).fill();
  doc.rect(summaryTableX + summaryColNum + summaryCol1 + summaryCol2, sumY, summaryCol3, summaryRowH).strokeColor(COLORS.border).lineWidth(0.5).stroke();
  doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.failed).text(`${failRate}%`, summaryTableX + summaryColNum + summaryCol1 + summaryCol2 + 5, sumY + 7, { width: summaryCol3 - 10, align: 'center' });
  doc.restore();
}

testResults.forEach((test, idx) => {
  const testName = test.name || 'Unnamed Test';
  const testNameSource = test.testNameSource || 'trace';
  const isPassed = test.status === 'passed';
  const statusText = isPassed ? 'Passed' : 'Failed';
  const statusColor = isPassed ? COLORS.passed : COLORS.failed;
  const rowNumber = idx + 1;
  const isFallback = testNameSource === 'subdir' || testNameSource === 'attachments';
  const rowBgColor = isFallback ? '#FFFF00' : COLORS.rowWhite;

  const testNameColWidth = summaryCol1 + summaryCol2 - 30;
  doc.fontSize(9).font('Helvetica');
  const textHeight = doc.heightOfString(testName, { width: testNameColWidth });
  let rowHeight = Math.max(summaryRowH, textHeight + 10);

  const pageBottom = CONFIG.PAGE.HEIGHT - CONFIG.PAGE.MARGIN.BOTTOM - 20;
  if (sumY + rowHeight > pageBottom) {
    newPage();
    doc.save();
    doc.fontSize(20).font('Helvetica-Oblique').fillColor(COLORS.text)
      .text('Execution Summary (continued)', LEFT, doc.y + 20, { width: CONTENT_WIDTH, align: 'center' });
    doc.restore();
    doc.y += 50;
    sumY = doc.y;

    doc.save();
    doc.rect(summaryTableX, sumY, summaryColNum, summaryRowH).fillColor(COLORS.cellBg).fill();
    doc.rect(summaryTableX, sumY, summaryColNum, summaryRowH).strokeColor(COLORS.border).lineWidth(0.5).stroke();
    doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text).text('#', summaryTableX + 5, sumY + 7, { width: summaryColNum - 10, align: 'center' });
    doc.rect(summaryTableX + summaryColNum, sumY, summaryCol1 + summaryCol2, summaryRowH).fillColor(COLORS.cellBg).fill();
    doc.rect(summaryTableX + summaryColNum, sumY, summaryCol1 + summaryCol2, summaryRowH).strokeColor(COLORS.border).lineWidth(0.5).stroke();
    doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text).text('Test Case Name', summaryTableX + summaryColNum + 5, sumY + 7);
    doc.rect(summaryTableX + summaryColNum + summaryCol1 + summaryCol2, sumY, summaryCol3, summaryRowH).fillColor(COLORS.cellBg).fill();
    doc.rect(summaryTableX + summaryColNum + summaryCol1 + summaryCol2, sumY, summaryCol3, summaryRowH).strokeColor(COLORS.border).lineWidth(0.5).stroke();
    doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text).text('Status', summaryTableX + summaryColNum + summaryCol1 + summaryCol2 + 5, sumY + 7, { width: summaryCol3 - 10, align: 'center' });
    doc.restore();
    sumY += summaryRowH;
  }

  doc.save();
  doc.rect(summaryTableX, sumY, summaryColNum, rowHeight).fillColor(rowBgColor).fill();
  doc.rect(summaryTableX, sumY, summaryColNum, rowHeight).strokeColor(COLORS.border).lineWidth(0.5).stroke();
  doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.textLight)
    .text(String(rowNumber), summaryTableX + 2, sumY + ((rowHeight / 2) - 4), { width: summaryColNum - 4, align: 'center' });

  doc.rect(summaryTableX + summaryColNum, sumY, summaryCol1 + summaryCol2, rowHeight).fillColor(rowBgColor).fill();
  doc.rect(summaryTableX + summaryColNum, sumY, summaryCol1 + summaryCol2, rowHeight).strokeColor(COLORS.border).lineWidth(0.5).stroke();

  const iconX = summaryTableX + summaryColNum + 8;
  const iconY = sumY + (rowHeight / 2) - 4;
  if (isPassed) drawCheckmark(iconX, iconY, 8, statusColor);
  else drawXIcon(iconX, iconY, 8, statusColor);

  doc.fontSize(9).font('Helvetica').fillColor(COLORS.text)
    .text(testName, summaryTableX + summaryColNum + 22, sumY + 5, { width: testNameColWidth, lineGap: 2 });

  doc.rect(summaryTableX + summaryColNum + summaryCol1 + summaryCol2, sumY, summaryCol3, rowHeight).fillColor(rowBgColor).fill();
  doc.rect(summaryTableX + summaryColNum + summaryCol1 + summaryCol2, sumY, summaryCol3, rowHeight).strokeColor(COLORS.border).lineWidth(0.5).stroke();
  doc.fontSize(9).font('Helvetica-Bold').fillColor(statusColor)
    .text(statusText, summaryTableX + summaryColNum + summaryCol1 + summaryCol2 + 5, sumY + ((rowHeight / 2) - 5), { width: summaryCol3 - 10, align: 'center' });
  doc.restore();

  if (rowHeight > summaryRowH) sumY += (rowHeight - summaryRowH);
  sumY += summaryRowH;
});

newPage();
doc.y = CONFIG.PAGE.MARGIN.TOP + 20;
doc.save();
doc.fontSize(14).font('Helvetica-Bold').fillColor(COLORS.passed)
  .text('SumUp Chart', LEFT, doc.y, { width: CONTENT_WIDTH, align: 'center', underline: true });
doc.restore();
doc.y += 30;

const pieChartCenterX = LEFT + CONTENT_WIDTH / 2;
const pieChartCenterY = doc.y + 150;
const pieChartRadiusX = 140;
const pieChartRadiusY = 100;
const pieChartDepth = 25;
const passedCount = analysis.passed.length;
const failedCount = analysis.failedCount;
const totalCount = passedCount + failedCount;

doc.save();
if (totalCount > 0) {
  for (let depth = pieChartDepth; depth > 0; depth -= 1) {
    const depthY = pieChartCenterY + depth;
    if (passedCount > 0) {
      doc.save();
      const depthGreen = depth === pieChartDepth ? '#2E8B2E' : '#3CB371';
      doc.fillColor(depthGreen);
      doc.ellipse(pieChartCenterX, depthY, pieChartRadiusX, pieChartRadiusY);
      doc.fill();
      doc.restore();
    }
  }

  if (passedCount > 0 && passedCount === totalCount) {
    doc.save();
    doc.fillColor('#90EE90');
    doc.ellipse(pieChartCenterX, pieChartCenterY, pieChartRadiusX, pieChartRadiusY);
    doc.fill();
    doc.strokeColor('#2E8B2E');
    doc.lineWidth(2);
    doc.ellipse(pieChartCenterX, pieChartCenterY, pieChartRadiusX, pieChartRadiusY);
    doc.stroke();
    doc.restore();

    doc.save();
    doc.fontSize(24).font('Helvetica-Bold').fillColor('#2E8B2E')
      .text(String(passedCount), pieChartCenterX - 15, pieChartCenterY - 12, { width: 30, align: 'center' });
    doc.restore();

    doc.save();
    doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.passed)
      .text('Passed', pieChartCenterX + pieChartRadiusX - 40, pieChartCenterY + pieChartRadiusY + pieChartDepth - 10);
    doc.restore();
  } else if (failedCount > 0 && failedCount === totalCount) {
    doc.save();
    doc.fillColor('#FF6B6B');
    doc.ellipse(pieChartCenterX, pieChartCenterY, pieChartRadiusX, pieChartRadiusY);
    doc.fill();
    doc.strokeColor('#CC0000');
    doc.lineWidth(2);
    doc.ellipse(pieChartCenterX, pieChartCenterY, pieChartRadiusX, pieChartRadiusY);
    doc.stroke();
    doc.restore();

    doc.save();
    doc.fontSize(24).font('Helvetica-Bold').fillColor('#CC0000')
      .text(String(failedCount), pieChartCenterX - 15, pieChartCenterY - 12, { width: 30, align: 'center' });
    doc.restore();

    doc.save();
    doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.failed)
      .text('Failed', pieChartCenterX + pieChartRadiusX - 40, pieChartCenterY + pieChartRadiusY + pieChartDepth - 10);
    doc.restore();
  } else {
    const passedPct = passedCount / totalCount;
    const failedPct = failedCount / totalCount;

    doc.save();
    doc.fillColor('#FF6B6B');
    doc.ellipse(pieChartCenterX, pieChartCenterY, pieChartRadiusX, pieChartRadiusY);
    doc.fill();
    doc.restore();

    if (passedCount > 0) {
      doc.save();
      doc.fillColor('#90EE90');
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + (passedPct * 2 * Math.PI);
      doc.moveTo(pieChartCenterX, pieChartCenterY);
      for (let angle = startAngle; angle <= endAngle; angle += 0.05) {
        const x = pieChartCenterX + pieChartRadiusX * Math.cos(angle);
        const y = pieChartCenterY + pieChartRadiusY * Math.sin(angle);
        doc.lineTo(x, y);
      }
      const finalX = pieChartCenterX + pieChartRadiusX * Math.cos(endAngle);
      const finalY = pieChartCenterY + pieChartRadiusY * Math.sin(endAngle);
      doc.lineTo(finalX, finalY);
      doc.lineTo(pieChartCenterX, pieChartCenterY);
      doc.fill();
      doc.restore();
    }

    const passedMidAngle = -Math.PI / 2 + (passedPct * Math.PI);
    const failedMidAngle = -Math.PI / 2 + (passedPct * 2 * Math.PI) + (failedPct * Math.PI);

    const passedLabelX = pieChartCenterX + (pieChartRadiusX * 0.5) * Math.cos(passedMidAngle);
    const passedLabelY = pieChartCenterY + (pieChartRadiusY * 0.5) * Math.sin(passedMidAngle);
    const failedLabelX = pieChartCenterX + (pieChartRadiusX * 0.5) * Math.cos(failedMidAngle);
    const failedLabelY = pieChartCenterY + (pieChartRadiusY * 0.5) * Math.sin(failedMidAngle);

    doc.save();
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#2E8B2E')
      .text(String(passedCount), passedLabelX - 15, passedLabelY - 10, { width: 30, align: 'center' });
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#CC0000')
      .text(String(failedCount), failedLabelX - 15, failedLabelY - 10, { width: 30, align: 'center' });
    doc.restore();

    doc.save();
    doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.failed)
      .text('Failed', pieChartCenterX - pieChartRadiusX + 20, pieChartCenterY + pieChartRadiusY + pieChartDepth + 15);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.passed)
      .text('Passed', pieChartCenterX + pieChartRadiusX - 50, pieChartCenterY + pieChartRadiusY + pieChartDepth + 15);
    doc.restore();
  }
}
doc.restore();
doc.y = pieChartCenterY + pieChartRadiusY + pieChartDepth + 50;

newPage();
doc.rect(LEFT, doc.y, CONTENT_WIDTH, 60).fillColor(COLORS.headerBg).fill();
doc.rect(LEFT, doc.y, CONTENT_WIDTH, 60).strokeColor(COLORS.border).lineWidth(1).stroke();
doc.fontSize(18).font('Helvetica-Bold').fillColor(COLORS.white)
  .text('Playwright Enterprise GenAI Platform Tests Execution Report', LEFT, doc.y + 12, { width: CONTENT_WIDTH, align: 'center' });
doc.fontSize(11).font('Helvetica').fillColor(COLORS.white)
  .text(`${CONFIG.PROJECT_NAME} Test Automation`, LEFT, doc.y + 38, { width: CONTENT_WIDTH, align: 'center' });
doc.y += 75;

const rowY = doc.y;
doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text).text('Project:', LEFT, rowY, { continued: false });
doc.fontSize(10).font('Helvetica').fillColor(COLORS.text).text(CONFIG.PROJECT_NAME, LEFT + 55, rowY, { continued: false });
doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text).text('Date:', LEFT + 350, rowY, { continued: false });
doc.fontSize(10).font('Helvetica').fillColor(COLORS.text).text(formatDateTime(analysis.startTime), LEFT + 390, rowY, { continued: false });
doc.y = rowY + 25;

const col1W = 140, col2W = 100, col3W = 155, col4W = CONTENT_WIDTH - col1W - col2W - col3W;
const rowH = 26;
const overallColor = analysis.overallResult === 'Failed' ? COLORS.failed : COLORS.passed;
let cY = doc.y;
drawCell(LEFT, cY, col1W, rowH, 'Result', { bgColor: COLORS.cellBg, fontStyle: 'Helvetica-Bold', fontSize: 10 });
drawCell(LEFT + col1W, cY, col2W, rowH, analysis.overallResult, { textColor: overallColor, fontStyle: 'Helvetica-Bold', fontSize: 10 });
drawCell(LEFT + col1W + col2W, cY, col3W, rowH, 'Creator', { bgColor: COLORS.cellBg, fontStyle: 'Helvetica-Bold', fontSize: 10 });
drawCell(LEFT + col1W + col2W + col3W, cY, col4W, rowH, CONFIG.AUTHOR.split(',')[0], { fontSize: 9 });
cY += rowH;
drawCell(LEFT, cY, col1W, rowH, 'Total execution time', { bgColor: COLORS.cellBg, fontStyle: 'Helvetica-Bold', fontSize: 10 });
drawCell(LEFT + col1W, cY, col2W, rowH, formatDuration(analysis.totalDuration), { fontSize: 10 });
drawCell(LEFT + col1W + col2W, cY, col3W, rowH, 'Start time', { bgColor: COLORS.cellBg, fontStyle: 'Helvetica-Bold', fontSize: 10 });
drawCell(LEFT + col1W + col2W + col3W, cY, col4W, rowH, formatDateTime(new Date(testStats.startTime || analysis.startTime)), { fontSize: 9 });
cY += rowH;
drawCell(LEFT, cY, col1W, rowH, 'Number of TestCases', { bgColor: COLORS.cellBg, fontStyle: 'Helvetica-Bold', fontSize: 10 });
drawCell(LEFT + col1W, cY, col2W, rowH, String(analysis.total), { fontSize: 10, fontStyle: 'Helvetica-Bold' });
drawCell(LEFT + col1W + col2W, cY, col3W, rowH, 'TestCases executed', { bgColor: COLORS.cellBg, fontStyle: 'Helvetica-Bold', fontSize: 10 });
drawCell(LEFT + col1W + col2W + col3W, cY, col4W, rowH, String(analysis.executed), { fontSize: 10 });
cY += rowH;
drawCell(LEFT, cY, col1W, rowH, 'Passed', { bgColor: COLORS.cellBg, fontStyle: 'Helvetica-Bold', fontSize: 10 });
drawCell(LEFT + col1W, cY, col2W, rowH, String(analysis.passed.length), { textColor: COLORS.passed, fontStyle: 'Helvetica-Bold', fontSize: 10 });
drawCell(LEFT + col1W + col2W, cY, col3W, rowH, 'Failed', { bgColor: COLORS.cellBg, fontStyle: 'Helvetica-Bold', fontSize: 10 });
drawCell(LEFT + col1W + col2W + col3W, cY, col4W, rowH, String(analysis.failedCount), { textColor: COLORS.failed, fontStyle: 'Helvetica-Bold', fontSize: 10 });
cY += rowH;
drawCell(LEFT, cY, col1W, rowH, 'TestCases not executed', { bgColor: COLORS.cellBg, fontStyle: 'Helvetica-Bold', fontSize: 10 });
drawCell(LEFT + col1W, cY, col2W, rowH, String(analysis.skipped.length), { fontSize: 10 });
drawCell(LEFT + col1W + col2W, cY, col3W, rowH, 'Environment', { bgColor: COLORS.cellBg, fontStyle: 'Helvetica-Bold', fontSize: 10 });
drawCell(LEFT + col1W + col2W + col3W, cY, col4W, rowH, CONFIG.ENVIRONMENT, { fontSize: 10 });
cY += rowH;
drawCell(LEFT, cY, col1W, rowH, 'Pass Rate', { bgColor: COLORS.cellBg, fontStyle: 'Helvetica-Bold', fontSize: 10 });
drawCell(LEFT + col1W, cY, col2W + col3W + col4W, rowH, `${analysis.passRate}%`, { textColor: parseFloat(analysis.passRate) >= 80 ? COLORS.passed : COLORS.failed, fontStyle: 'Helvetica-Bold', fontSize: 10 });
doc.y = cY + rowH + 30;

testResults.forEach((test, testIndex) => {
  const stepsInfo = test.stepsSource === 'trace' ? '📷 trace' : test.stepsSource === 'spec-file' ? '📄 spec-file' : test.stepsSource === 'attachments' ? '📎 attachments' : '';
  console.log(`📄 Processing TestCase ${testIndex + 1}/${testResults.length}: ${truncateText(test.name, 40)} [${stepsInfo}]`);

  newPage();
  const testName = test.name || 'Unnamed Test';
  const specFile = test.specFile || 'Unknown spec file';
  const testNameSource = test.testNameSource || 'trace';

  doc.save();
  doc.fontSize(9).font('Helvetica-Oblique').fillColor(COLORS.textLight).text(`Spec: ${specFile}`, LEFT, doc.y);
  doc.restore();
  doc.y += 15;

  doc.y = drawTestCaseTitle(testName, doc.y, testNameSource);
  doc.y = drawEnvironmentRow(doc.y);
  doc.y = drawTestCaseBox(testName, test.status, doc.y, testNameSource);

  const objective = test.labels?.find(l => l.name === 'feature')?.value || `Automated test: ${truncateText(testName, 50)}`;
  doc.y = drawTestObjective(objective, doc.y);
  doc.y = drawMetadataGrid(test, doc.y);

  function collectSteps(steps, depth = 0) {
    const result = [];
    if (!steps || !Array.isArray(steps)) return result;
    const seenAttachments = new Set();

    steps.forEach(step => {
      const isInternal = step.name?.includes('Fixture') || step.name?.includes('Hook') || step.name === 'screenshot' || step.name?.startsWith('Create browser') || step.name?.startsWith('Create page') || step.name?.startsWith('Launch ') || step.name?.startsWith('Close ');
      const SKIP_ATTACHMENTS = ['video', 'screenshot', 'trace', 'error-context'];

      if (!isInternal && step.name) {
        const uniqueAttachments = (step.attachments || []).filter(att => {
          if (SKIP_ATTACHMENTS.includes(att.name?.toLowerCase())) return false;
          if (att.source && !seenAttachments.has(att.source)) {
            seenAttachments.add(att.source);
            return true;
          }
          return false;
        });

        const screenshots = step.screenshots || [];

        result.push({
          name: step.name,
          status: step.status || 'passed',
          depth,
          statusDetails: step.statusDetails,
          error: step.error || null,
          attachments: uniqueAttachments,
          screenshotPath: step.screenshotPath,
          stepNumber: step.stepNumber,
          screenshots
        });
      }

      if (step.steps?.length > 0) result.push(...collectSteps(step.steps, depth + 1));
    });

    return result;
  }

  const allSteps = collectSteps(test.steps);
  const displayedScreenshots = new Set();
  let currentParentStepNum = 0;
  let subStepNum = 0;

  allSteps.forEach((step, stepIndex) => {
    let stepNumber = '';
    let showBlueHeader = false;

    if (step.depth === 0) {
      const matchedWorkflowStep = findMatchingWorkflowStep(step.name, step.stepNumber);
      if (matchedWorkflowStep && matchedWorkflowStep.stepNumber > 0) {
        currentParentStepNum = matchedWorkflowStep.stepNumber;
        stepNumber = `${matchedWorkflowStep.stepNumber}`;
        showBlueHeader = true;
        subStepNum = 0;
      } else {
        currentParentStepNum++;
        stepNumber = `${currentParentStepNum}`;
        showBlueHeader = true;
        subStepNum = 0;
      }

      if (showBlueHeader) {
        doc.y = checkPageBreak(90);
        doc.y = drawTestStepDescriptionHeader(step.name, currentParentStepNum, doc.y);
      } else {
        doc.y = checkPageBreak(60);
      }
    } else {
      subStepNum++;
      stepNumber = currentParentStepNum > 0 ? `${currentParentStepNum}.${subStepNum}` : '';
      doc.y = checkPageBreak(60);
    }

    const humanized = humanizePlaywrightStep(step.name);
    const action = humanized.action;
    const humanDesc = getHumanizedDescription(step.name, action);

    doc.y = drawStepRow(humanized.displayName, humanized.value, action, step.status, humanDesc.logInfo || '', doc.y, stepIndex % 2 === 1, step.depth, stepNumber);

    if (step.status === 'passed') {
      const expectedResult = humanDesc.expected || `${humanized.displayName}`;
      const actualResult = humanDesc.actual || `${humanized.displayName} completed successfully`;
      doc.y = drawDetailRow('Expected Result:', expectedResult, step.status, doc.y);
      doc.y = drawDetailRow('Actual Result:', actualResult, step.status, doc.y);
      doc.y = drawDetailRow('Verification Point:', humanDesc.verificationPoint, step.status, doc.y);
      doc.y = drawDetailRow('Execution Status:', 'Passed', step.status, doc.y);

      if (step.screenshots && step.screenshots.length > 0) {
        step.screenshots.forEach(screenshotPath => {
          if (fs.existsSync(screenshotPath) && !displayedScreenshots.has(screenshotPath)) {
            displayedScreenshots.add(screenshotPath);
            doc.y = drawScreenshot(screenshotPath, step.name || 'Screenshot', doc.y);
          }
        });
      }
      doc.y += 12;
    }

    if (step.status === 'failed' || step.status === 'broken') {
      doc.y = checkPageBreak(80);
      const errorMsg = step.error?.message || step.statusDetails?.message || step.errorMessage;
      const failedDesc = getFailedDescription(step.name, errorMsg);
      doc.y = drawDetailRow('Expected Result:', failedDesc.expected, step.status, doc.y);
      doc.y = drawDetailRow('Actual Result:', failedDesc.actual, step.status, doc.y);
      doc.y = drawDetailRow('Verification Point:', failedDesc.verificationPoint || humanDesc.verificationPoint, step.status, doc.y);
      doc.y = drawDetailRow('Execution Status:', 'Failed', step.status, doc.y);

      if (step.screenshots && step.screenshots.length > 0) {
        step.screenshots.forEach(screenshotPath => {
          if (fs.existsSync(screenshotPath) && !displayedScreenshots.has(screenshotPath)) {
            displayedScreenshots.add(screenshotPath);
            doc.y = drawScreenshot(screenshotPath, step.name || 'Screenshot', doc.y);
          }
        });
      }

      if (errorMsg) {
        doc.y = checkPageBreak(120);
        doc.y = drawErrorBox(errorMsg, doc.y);
      }

      if (step.error && step.error.snippet) {
        doc.y = checkPageBreak(120);
        doc.y = drawCodeSnippet(step.error.snippet, step.error.location, doc.y);
      }

      doc.y += 12;
    }
  });

  if ((test.status === 'failed' || test.status === 'broken' || test.status === 'timedOut') && test.statusDetails?.message && allSteps.length === 0) {
    doc.y = checkPageBreak(100);
    doc.y = drawErrorBox(test.statusDetails.message, doc.y);
  }
});

addPageFooter();
doc.end();

stream.on('finish', () => {
  const stats = fs.statSync(OUTPUT_FILE);
  const sizeKB = (stats.size / 1024).toFixed(2);

  console.log('');
  console.log('┌───────────────────────────────────────────────────────┐');
  console.log('│               ✅ REPORT GENERATED SUCCESSFULLY        │');
  console.log('├───────────────────────────────────────────────────────┤');
  console.log(`│ 📁 File: ${path.basename(OUTPUT_FILE).padEnd(49)}│`);
  console.log(`│ 📦 Size: ${(`${sizeKB} KB`).padEnd(50)}│`);
  console.log(`│ 📄 Pages: ${String(pageNumber).padEnd(49)}│`);
  console.log(`│ 📊 Tests: ${(analysis.total + ` (${analysis.passRate} % pass rate)`).padEnd(49)}│`);
  console.log('└───────────────────────────────────────────────────────┘');
  console.log('');
  console.log(`📍 Location: ${OUTPUT_FILE}`);
  console.log('');
});

stream.on('error', (err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
