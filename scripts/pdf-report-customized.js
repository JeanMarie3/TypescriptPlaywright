#!/usr/bin/env node

/**
 * ========================================================================
 * TOSCA-STYLE PLAYWRIGHT TEST EXECUTION REPORT GENERATOR - V25
 * ========================================================================
 *
 * Generates professional PDF reports using Playwright JSON Reporter data
 * - Same data source as Playwright HTML report (100% accuracy)
 *
 * VERSION 25: ADD ALL SCREENSHOTS UNDER EACH STEP
 * ========================================================================
 *
 * DATA SOURCE:
 * - playwright-report/test-results.json (JSON Reporter output)
 * - Same exact data used by Playwright's official HTML report
 * - Direct access to: test status, spec files, test names, steps, durations
 *
 * ADVANTAGES OVER V22:
 * - ✅ 100% accurate test status (passed/failed/skipped)
 * - ✅ 100% accurate spec file paths
 * - ✅ 100% accurate test names (no extraction needed)
 * - ✅ 100% accurate test steps with durations
 * - ✅ No trace file parsing complexity
 * - ✅ No fallback strategies needed
 * - ✅ Matches HTML report exactly (same source data)
 *
 * JSON STRUCTURE:
 * - config: Test configuration
 * - suites[]: Top-level test suites (file-based)
 *   - suites[]: Nested describe blocks
 *     - specs[]: Individual test cases
 *       - tests[]: Test runs with retries
 *         - results[]: Test execution results
 *           - steps[]: Test steps with title & duration
 *           - status: "passed" | "failed" | "skipped"
 *           - duration: milliseconds
 *
 * ========================================================================
 * PROJECT CONFIGURATION (Customizable via Environment Variables)
 * ========================================================================
 *
 * Set these environment variables to customize the report for your project:
 *
 * - PROJECT_NAME: Name of your project (default: "Enterprise GenAI Platform")
 * - COMPANY_NAME: Company name (default: "Novartis")
 * - TEST_PHASE: Test phase description (default: "Regression Automation")
 * - BASE_URL: Application URL (default: "https://gain-qa.novartis.net")
 * - ENV_NAME: Environment name (default: "QA")
 * - REPORT_VERSION: Report version (auto-detected from filename or "Unknown Version")
 *
 * Example usage for different project:
 * $env:PROJECT_NAME="My Custom Project"; $env:COMPANY_NAME="Acme Corp"; node generate-pdf-report-v23.js
 *
 * Author: Sindayigaya, Jean Marie (Ext)
 * Current Project: Enterprise GenAI Platform Test Automation
 * ========================================================================
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '../environments/.env.local') });

// ========================================================================
// MODULAR COMPONENTS - V23
// ========================================================================
const { drawPieChart } = require('./modules/pie-chart');

// ========================================================================
// V23: JSON REPORTER DATA LOADER
// ========================================================================

/**
 * Loads test data from Playwright's JSON reporter output
 * This is the SAME data source used by Playwright's HTML report (100% accuracy)
 * @returns {Object} Parsed JSON reporter data
 */
function loadJsonReporterData() {
    const jsonPath = path.join(__dirname, '../playwright-report/test-results.json');

    if (!fs.existsSync(jsonPath)) {
        console.error('❌ Error: test-results.json not found');
        console.error('   Path checked: ' + jsonPath);
        console.error('   Run tests first with JSON reporter enabled');
        process.exit(1);
    }

    try {
        const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

        if (!data.suites || data.suites.length === 0) {
            console.error('❌ Error: test-results.json contains no test suites');
            process.exit(1);
        }

        return data;
    } catch (error) {
        console.error('❌ Error parsing test-results.json:', error.message);
        process.exit(1);
    }
}

/**
 * Extracts all tests from JSON reporter data
 * Recursively processes nested suites and specs
 * @param {Object} jsonData - Parsed JSON reporter data
 * @returns {Array} Array of test objects with spec, name, status, steps, attachments
 */
function extractTestsFromJson(jsonData) {
    const tests = [];

    function processSuite(suite, suitePath = []) {
        const currentPath = suite.title ? [...suitePath, suite.title] : suitePath;

        if (suite.specs && suite.specs.length > 0) {
            suite.specs.forEach(spec => {
                spec.tests.forEach(test => {
                    const result = test.results[test.results.length - 1];

                    tests.push({
                        specFile: spec.file || suite.file || 'Unknown',
                        testName: spec.title || 'Unnamed Test',
                        suitePath: currentPath,
                        status: result.status || 'unknown',
                        duration: result.duration || 0,
                        startTime: result.startTime ? new Date(result.startTime) : null,
                        steps: result.steps || [],
                        errors: result.errors || [],
                        attachments: result.attachments || [] // V25: Include test-level attachments
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
        tests: tests,
        stats: jsonData.stats || {}
    };
}

// ========================================================================
// V17: TRACE PARSING - Extract steps from Playwright trace.zip/test.trace
// ========================================================================

/**
 * Extracts test steps from trace.zip's test.trace file using AdmZip (fast, in-memory)
 * This matches exactly what Playwright HTML report shows
 * @param {string} subdirPath - Path to test results subdirectory
 * @returns {Array} Array of step objects with name, status, duration, etc.
 */

// ========================================================================
// HELPER: Extract display name dynamically from system
// ========================================================================

function getExecutedByName() {
    // Priority 1: GAIN_USER environment variable
    const gainUser = process.env.GAIN_USER || '';
    if (gainUser) {
        const emailPrefix = gainUser.split('@')[0];
        return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
    }

    // Priority 2: Git config user.name
    try {
        const gitName = execSync('git config user.name', { encoding: 'utf8' }).trim();
        if (gitName) return gitName;
    } catch (e) {
        /* git not configured */
    }

    // Priority 3: Windows USERNAME environment variable (works in PowerShell and CMD)
    const windowsUser = process.env.USERNAME || '';
    if (windowsUser) {
        return windowsUser.charAt(0).toUpperCase() + windowsUser.slice(1).toLowerCase();
    }

    // Priority 4: OS username via Node.js os module
    const osUser = os.userInfo().username;
    if (osUser) {
        return osUser.charAt(0).toUpperCase() + osUser.slice(1).toLowerCase();
    }

    // Fallback
    return 'Unknown User';
}

function getExecutedByEmail() {
    // Priority 1: GAIN_USER environment variable
    const gainUser = process.env.GAIN_USER || '';
    if (gainUser && gainUser.includes('@')) return gainUser;

    // Priority 2: Git config user.email
    try {
        const gitEmail = execSync('git config user.email', { encoding: 'utf8' }).trim();
        if (gitEmail) return gitEmail;
    } catch (e) {
        /* git not configured */
    }

    // Priority 3: Construct from Windows USERNAME environment variable
    const windowsUser = process.env.USERNAME || '';
    if (windowsUser) {
        return `${windowsUser.toLowerCase()}@novartis.net`;
    }

    // Priority 4: Construct from OS username via Node.js os module
    const osUser = os.userInfo().username;
    if (osUser) {
        return `${osUser.toLowerCase()}@novartis.net`;
    }

    // Fallback
    return 'unknown@novartis.net';
}

function getUserDomain() {
    // Windows USERDOMAIN environment variable
    return process.env.USERDOMAIN || 'NOVARTIS';
}

function getComputerName() {
    // Windows COMPUTERNAME environment variable
    return process.env.COMPUTERNAME || os.hostname() || 'Unknown';
}

// ========================================================================
// CONFIGURATION
// ========================================================================

// Extract version from script filename (e.g., generate-pdf-report-v14.js -> v14)
function getReportVersion() {
    const scriptName = path.basename(__filename);
    const versionMatch = scriptName.match(/v(\d+)/i);
    if (versionMatch) {
        return `v${versionMatch[1]}`;
    }
    return process.env.REPORT_VERSION || 'Unknown Version';
}

const CONFIG = {
    TEST_RESULTS_DIR: path.join(__dirname, '../test-results'),
    TESTS_DIR: path.join(__dirname, '../tests'),
    OUTPUT_DIR: path.join(__dirname, '../reports'),

    // ========================================================================
    // PROJECT CONFIGURATION - Update these for different projects
    // ========================================================================
    PROJECT_NAME: process.env.PROJECT_NAME || 'Enterprise GenAI Platform',
    COMPANY_NAME: process.env.COMPANY_NAME || 'Novartis',
    TEST_PHASE: process.env.TEST_PHASE || 'Regression Automation',
    URL_PATH: process.env.BASE_URL || 'https://gain-qa.novartis.net',

    // ========================================================================
    // DYNAMIC CONFIGURATION - Auto-detected or from environment variables
    // ========================================================================
    REPORT_VERSION: getReportVersion(), // Dynamic: extracts from filename or env
    AUTHOR: getExecutedByName(), // Dynamic: reads from system/git/env
    AUTHOR_EMAIL: getExecutedByEmail(), // Dynamic: reads from system/git/env
    USER_DOMAIN: getUserDomain(), // Dynamic: reads from Windows USERDOMAIN
    COMPUTER_NAME: getComputerName(), // Dynamic: reads from Windows COMPUTERNAME
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

// ========================================================================
// TOSCA COLOR SCHEME
// ========================================================================

const COLORS = {
    primary: '#0D7377',
    primaryDark: '#14505C',
    passed: '#00B050',
    failed: '#FF0000',
    broken: '#FF6600',
    skipped: '#808080',
    orange: '#FF9900', // Warning color for fallback extractions
    text: '#000000',
    textDark: '#333333',
    textLight: '#666666',
    textMuted: '#999999',
    white: '#FFFFFF',
    headerBg: '#F4F2F9',
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

// ========================================================================
// TIMESTAMP & OUTPUT
// ========================================================================

const timestamp = new Date();
const timestampStr = timestamp.toISOString().replace(/[:.]/g, '-').substring(0, 19);
const envName = CONFIG.ENVIRONMENT;
const OUTPUT_FILE = path.join(CONFIG.OUTPUT_DIR, `Playwright-GenAI-Tests-Execution-Report-${envName}-${timestampStr}.pdf`);

// ========================================================================
// UTILITY FUNCTIONS
// ========================================================================

function formatDuration(ms) {
    if (!ms || ms < 0) return '0.0s';

    const totalSeconds = ms / 1000;
    const totalMinutes = totalSeconds / 60;
    const totalHours = totalMinutes / 60;

    // Match HTML report format: show decimal precision
    if (totalHours >= 1) {
        return `${totalHours.toFixed(1)}h`;
    }
    if (totalMinutes >= 1) {
        return `${totalMinutes.toFixed(1)}m`;
    }
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
    switch (status?.toLowerCase()) {
        case 'passed': return COLORS.passed;
        case 'failed': return COLORS.failed;
        case 'timedout': return COLORS.failed;
        case 'broken': return COLORS.broken;
        default: return COLORS.skipped;
    }
}

function getStatusText(status) {
    switch (status?.toLowerCase()) {
        case 'passed': return 'PASSED';
        case 'failed': return 'FAILED';
        case 'timedout': return 'FAILED';
        case 'broken': return 'ERROR';
        default: return 'NOT EXECUTED';
    }
}

// ========================================================================
// HUMANIZE PLAYWRIGHT STEP NAMES - Convert raw Playwright locators to readable text
// ========================================================================

function humanizePlaywrightStep(rawStepName) {
    if (!rawStepName) return {
        displayName: 'Unknown Step',
        fieldName: 'Unknown',
        value: '',
        action: 'Verify'
    };

    const stepName = rawStepName;
    const lowerName = rawStepName.toLowerCase();

    // Check if this is already a human-readable workflow step name (not a Playwright locator)
    // Playwright locators contain patterns like: getByRole, getByText, locator(, fill , click getBy, etc.
    const isPlaywrightLocator =
        /getBy|locator\s*\(|\.filter\s*\(|\.first\s*\(|\.nth\s*\(|^Fill|click|Type\s+"[^"]+"|^getBy/i.test(stepName);

    if (!isPlaywrightLocator) {
        // This is already a human-readable step name (e.g., "Navigate To Studio Link")
        // Return it as-is with inferred action type
        let action = 'Verify';
        if (lowerName.includes('navigate') || lowerName.includes('go to')) action = 'Navigate';
        else if (lowerName.includes('click')) action = 'Click';
        else if (lowerName.includes('fill') || lowerName.includes('enter') || lowerName.includes('input') || lowerName.includes('type')) action = 'Input';
        else if (lowerName.includes('verify') || lowerName.includes('check') || lowerName.includes('assert') || lowerName.includes('expect')) action = 'Verify';
        else if (lowerName.includes('wait')) action = 'Wait';
        else if (lowerName.includes('select') || lowerName.includes('choose')) action = 'Select';
        else if (lowerName.includes('capture') || lowerName.includes('screenshot')) action = 'Capture';

        return {
            displayName: stepName,
            fieldName: stepName,
            value: '',
            action: action
        };
    }

    // Extract value from Fill commands: Fill "value" getByRole(...)
    let extractedValue = '';
    const fillValueMatch = stepName.match(/^Fill\s+"([^"]+)"\s+/i);
    if (fillValueMatch) {
        extractedValue = fillValueMatch[1];
    }

    // Extract element name from various Playwright locators
    let elementName = '';

    // Pattern: getByRole('type', { name: 'Name' })
    const roleNameMatch = stepName.match(/getByRole\s*\(\s*'([^']+)'\s*,\s*\{\s*name:\s*'([^']+)'/i);
    if (roleNameMatch) {
        elementName = roleNameMatch[2];
    }

    // Pattern: getByText('Text')
    const textMatch = stepName.match(/getByText\s*\(\s*'([^']+)'/i);
    if (textMatch && !elementName) {
        elementName = textMatch[1];
    }

    // Pattern: getByTitle('Title')
    const titleMatch = stepName.match(/getByTitle\s*\(\s*'([^']+)'/i);
    if (titleMatch && !elementName) {
        elementName = titleMatch[1];
    }

    // Pattern: getByPlaceholder('Placeholder')
    const placeholderMatch = stepName.match(/getByPlaceholder\s*\(\s*'([^']+)'/i);
    if (placeholderMatch && !elementName) {
        elementName = placeholderMatch[1];
    }

    // Pattern: locator with title attribute: locator('...[title="Name"]')
    const locatorTitleMatch = stepName.match(/locator\s*\([^)]*title\s*=\s*["']([^"']+)["']/i);
    if (locatorTitleMatch && !elementName) {
        elementName = locatorTitleMatch[1];
    }

    // Pattern: locator with id: locator('#id-name')
    const locatorIdMatch = stepName.match(/locator\s*\(\s*['"]#([^"']+)["']/i);
    if (locatorIdMatch && !elementName) {
        // Convert id to readable name: tab-0 -> Tab
        elementName = locatorIdMatch[1]
            .replace(/-\d+$/, '')
            .replace(/-/g, ' ');
        elementName = elementName.charAt(0).toUpperCase() + elementName.slice(1);
    }

    // Pattern: filter with hasText:
    const hasTextMatch = stepName.match(/hasText:\s*["']([^"']+)["']/i);
    if (hasTextMatch && !elementName) {
        elementName = hasTextMatch[1];
    }

    // Pattern: filter with regex /^Text$/
    const regexTextMatch = stepName.match(/\^([^$]+)\$\//);
    if (regexTextMatch && !elementName) {
        elementName = regexTextMatch[1];
    }

    // Determine action type and create humanized display name
    let action = 'Verify';
    let displayName = stepName;
    let fieldName = elementName || 'Element';

    // CLICK actions
    if (lowerName.startsWith('click')) {
        action = 'Click';
        if (elementName) {
            // Check if it's a button, link, etc.
            if (roleNameMatch && roleNameMatch[1]) {
                const roleType = roleNameMatch[1].toLowerCase();
                if (roleType === 'button') {
                    displayName = `Click on "${elementName}" button`;
                } else if (roleType === 'link') {
                    displayName = `Click on "${elementName}" link`;
                } else {
                    displayName = `Click on "${elementName}"`;
                }
            } else {
                displayName = `Click on "${elementName}"`;
            }
            fieldName = elementName;
        } else if (lowerName.includes('locator')) {
            // Try to make locator-based clicks more readable
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
    }

    // FILL/INPUT actions
    else if (lowerName.startsWith('fill')) {
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
    }

    // TYPE actions
    else if (lowerName.startsWith('type')) {
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
    }

    // NAVIGATE actions
    else if (lowerName.startsWith('navigate')) {
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
    }

    // EXPECT/VERIFY actions
    else if (lowerName.startsWith('expect')) {
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
    }

    // WAIT actions
    else if (lowerName.startsWith('wait')) {
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
    }

    // SCREENSHOT actions
    else if (lowerName === 'screenshot') {
        action = 'Capture';
        displayName = 'Capture current page state';
        fieldName = 'Screenshot';
    }

    // RELOAD actions
    else if (lowerName === 'reload') {
        action = 'Navigate';
        displayName = 'Reload page';
        fieldName = 'Reload';
    }

    // CLOSE actions
    else if (lowerName.startsWith('close')) {
        action = 'Close';
        if (lowerName.includes('page')) {
            displayName = 'Close page';
            fieldName = 'Page';
        } else {
            displayName = 'Close window';
            fieldName = 'Window';
        }
    }

    // Named screenshot attachments (already humanized)
    else if (
        stepName.includes(' - Before') ||
        stepName.includes(' - After') ||
        stepName.includes(' - Url')
    ) {
        action = 'Capture';
        displayName = stepName;
        fieldName = 'Screenshot';
    }

    // Default: return original with some cleanup
    else {
        displayName = stepName;
        fieldName = truncateText(stepName, 20);
    }

    return {
        displayName: displayName,
        fieldName: fieldName,
        value: extractedValue,
        action: action
    };
}

// ========================================================================
// DYNAMIC STEP HANDLING - No hardcoded steps, extract from results
// ========================================================================

// Helper function to find matching workflow step dynamically
// Instead of hardcoded steps, uses the stepNumber from parsed results
function findMatchingWorkflowStep(stepName, stepNumber) {
    // If we have a step number from parsing, use it directly
    if (stepNumber && stepNumber > 0) {
        return {
            stepNumber: stepNumber,
            title: stepName
        };
    }

    // Fallback: Try to extract step number from the step name pattern
    const name = stepName.toLowerCase();
    const stepMatch = name.match(/step\s*(\d+)/i);
    if (stepMatch) {
        return {
            stepNumber: parseInt(stepMatch[1], 10),
            title: stepName
        };
    }

    return null;
}

function getHumanizedDescription(stepName, action) {
    const name = stepName.toLowerCase();

    // ========================================================================
    // DYNAMIC STEP DESCRIPTION - Generate from step name instead of hardcoded
    // ========================================================================

    // Clean up the step name for display
    let cleanStepName = stepName
        .replace(/^step\s*\d+\s*[-:]\s*/i, '') // Remove "Step X - " prefix
        .replace(/[-_]/g, ' ') // Replace dashes/underscores with spaces
        .trim();

    // Remove action prefixes to avoid duplication like "Navigate to Navigate To..."
    // This handles cases where step name already includes the action verb
    const cleanStepNameLower = cleanStepName.toLowerCase();
    if (cleanStepNameLower.startsWith('navigate to ')) {
        cleanStepName = cleanStepName.substring('navigate to '.length).trim();
    } else if (cleanStepNameLower.startsWith('click on ')) {
        cleanStepName = cleanStepName.substring('click on '.length).trim();
    } else if (cleanStepNameLower.startsWith('click ')) {
        cleanStepName = cleanStepName.substring('click '.length).trim();
    } else if (cleanStepNameLower.startsWith('verify ')) {
        cleanStepName = cleanStepName.substring('verify '.length).trim();
    } else if (cleanStepNameLower.startsWith('search ')) {
        cleanStepName = cleanStepName.substring('search '.length).trim();
    } else if (cleanStepNameLower.startsWith('open ')) {
        cleanStepName = cleanStepName.substring('open '.length).trim();
    } else if (cleanStepNameLower.startsWith('configure ')) {
        cleanStepName = cleanStepName.substring('configure '.length).trim();
    } else if (cleanStepNameLower.startsWith('create ')) {
        cleanStepName = cleanStepName.substring('create '.length).trim();
    } else if (cleanStepNameLower.startsWith('install ')) {
        cleanStepName = cleanStepName.substring('install '.length).trim();
    } else if (cleanStepNameLower.startsWith('upload ')) {
        cleanStepName = cleanStepName.substring('upload '.length).trim();
    } else if (cleanStepNameLower.startsWith('run ')) {
        cleanStepName = cleanStepName.substring('run '.length).trim();
    } else if (cleanStepNameLower.startsWith('publish ')) {
        cleanStepName = cleanStepName.substring('publish '.length).trim();
    } else if (cleanStepNameLower.startsWith('execute ')) {
        cleanStepName = cleanStepName.substring('execute '.length).trim();
    } else if (cleanStepNameLower.startsWith('select ')) {
        cleanStepName = cleanStepName.substring('select '.length).trim();
    } else if (cleanStepNameLower.startsWith('wait for ')) {
        cleanStepName = cleanStepName.substring('wait for '.length).trim();
    } else if (cleanStepNameLower.startsWith('enter ')) {
        cleanStepName = cleanStepName.substring('enter '.length).trim();
    } else if (cleanStepNameLower.startsWith('fill ')) {
        cleanStepName = cleanStepName.substring('fill '.length).trim();
    } else if (cleanStepNameLower.startsWith('capture ')) {
        cleanStepName = cleanStepName.substring('capture '.length).trim();
    } else if (cleanStepNameLower.startsWith('add ')) {
        cleanStepName = cleanStepName.substring('add '.length).trim();
    } else if (cleanStepNameLower.startsWith('link ')) {
        cleanStepName = cleanStepName.substring('link '.length).trim();
    }

    // Generate expected/actual based on action type
    const actionType = getActionType(name);

    // Determine if this is a verification step
    const isVerification =
        actionType === 'verify' ||
        name.includes('verify') ||
        name.includes('check') ||
        name.includes('assert') ||
        name.includes('expect');

    // Generate dynamic descriptions based on the step name
    let expected = cleanStepName;
    let actual = `${cleanStepName} completed successfully`;
    let verificationPoint = 'Y'; // Default to Y for all steps
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
            // For workflow steps, generate contextual descriptions
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
                // Default: use the step name as-is
                expected = cleanStepName;
                actual = `${cleanStepName} completed successfully`;
            }
            break;
    }

    return { expected, actual, verificationPoint, logInfo };
}

// Helper: Determine generic action type from step name
function getActionType(name) {
    if (name.includes('capture') || name.includes('screenshot') || name.includes('page state')) return 'capture';
    if (name.includes('click')) return 'click';
    if (name.includes('fill') || name.includes('input') || name.includes('type') || name.includes('enter value')) return 'fill';
    if (name.includes('navigate') || name.includes('go to')) return 'navigate';
    if (
        name.includes('expect') ||
        name.includes('verify') ||
        name.includes('assert') ||
        name.includes('check') ||
        name.includes('should') ||
        name.includes('tobevisible') ||
        name.includes('tocontaintext')
    ) return 'verify';
    if (name.includes('wait')) return 'wait';
    if (name.includes('select') || name.includes('choose')) return 'select';
    return 'default';
}

function getFailedDescription(stepName, errorMessage) {
    const name = stepName.toLowerCase();

    // Clean up the step name for display - same logic as getHumanizedDescription
    let cleanStepName = stepName
        .replace(/^step\s*\d+\s*[-:]\s*/i, '') // Remove "Step X - " prefix
        .replace(/[-_]/g, ' ') // Replace dashes/underscores with spaces
        .trim();

    // Remove action prefixes to avoid duplication
    const cleanStepNameLower = cleanStepName.toLowerCase();
    if (cleanStepNameLower.startsWith('navigate to ')) {
        cleanStepName = cleanStepName.substring('navigate to '.length).trim();
    } else if (cleanStepNameLower.startsWith('click on ')) {
        cleanStepName = cleanStepName.substring('click on '.length).trim();
    } else if (cleanStepNameLower.startsWith('click ')) {
        cleanStepName = cleanStepName.substring('click '.length).trim();
    } else if (cleanStepNameLower.startsWith('verify ')) {
        cleanStepName = cleanStepName.substring('verify '.length).trim();
    } else if (cleanStepNameLower.startsWith('search ')) {
        cleanStepName = cleanStepName.substring('search '.length).trim();
    } else if (cleanStepNameLower.startsWith('open ')) {
        cleanStepName = cleanStepName.substring('open '.length).trim();
    } else if (cleanStepNameLower.startsWith('configure ')) {
        cleanStepName = cleanStepName.substring('configure '.length).trim();
    } else if (cleanStepNameLower.startsWith('create ')) {
        cleanStepName = cleanStepName.substring('create '.length).trim();
    } else if (cleanStepNameLower.startsWith('install ')) {
        cleanStepName = cleanStepName.substring('install '.length).trim();
    } else if (cleanStepNameLower.startsWith('upload ')) {
        cleanStepName = cleanStepName.substring('upload '.length).trim();
    } else if (cleanStepNameLower.startsWith('run ')) {
        cleanStepName = cleanStepName.substring('run '.length).trim();
    } else if (cleanStepNameLower.startsWith('publish ')) {
        cleanStepName = cleanStepName.substring('publish '.length).trim();
    } else if (cleanStepNameLower.startsWith('execute ')) {
        cleanStepName = cleanStepName.substring('execute '.length).trim();
    }

    const logInfo = errorMessage ? truncateText(errorMessage, 100) : 'Step execution failed.';
    const actionType = getActionType(name);

    // The rest of this function is cut off in the photos,
    // but it appears to generate expected/actual strings for failed steps,
    // similar to getHumanizedDescription, using "failed" instead of "successfully".
}