#!/usr/bin/env node

/**
 * Test Case Counter
 * Counts all unique test cases in the framework
 */

const fs = require('fs');
const path = require('path');

const TESTS_DIR = path.join(__dirname, '../tests');

console.log('📊 Counting Test Cases in Framework...\n');

// Function to recursively find all test files
function findTestFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'tests-examples') {
        findTestFiles(filePath, fileList);
      }
    } else if (file.endsWith('.spec.ts') || file.endsWith('.spec.js')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Function to count test cases in a file
function countTestsInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);

  // Match test() and test.skip()
  const testMatches = content.match(/test\s*\(/g) || [];
  const testSkipMatches = content.match(/test\.skip\s*\(/g) || [];

  const totalTests = testMatches.length;
  const skippedTests = testSkipMatches.length;
  const activeTests = totalTests - skippedTests;

  // Extract test names/IDs
  const testNames = [];
  const testRegex = /test\s*\(\s*['"`]([^'"`]+)['"`]/g;
  let match;

  while ((match = testRegex.exec(content)) !== null) {
    testNames.push(match[1]);
  }

  return {
    fileName,
    filePath,
    totalTests,
    activeTests,
    skippedTests,
    testNames
  };
}

// Find all test files
const testFiles = findTestFiles(TESTS_DIR);

console.log(`📁 Found ${testFiles.length} test files\n`);

let totalTests = 0;
let totalActiveTests = 0;
let totalSkippedTests = 0;
const allTestNames = [];

// Count tests in each file
console.log('📝 Test Files Breakdown:\n');
console.log('═══════════════════════════════════════════════════════════════');

testFiles.forEach(file => {
  const stats = countTestsInFile(file);

  console.log(`\n📄 ${stats.fileName}`);
  console.log(`   Total Tests: ${stats.totalTests}`);
  console.log(`   Active: ${stats.activeTests} | Skipped: ${stats.skippedTests}`);

  totalTests += stats.totalTests;
  totalActiveTests += stats.activeTests;
  totalSkippedTests += stats.skippedTests;
  allTestNames.push(...stats.testNames);

  // Show first 3 test names as preview
  if (stats.testNames.length > 0) {
    console.log(`   Preview:`);
    stats.testNames.slice(0, 3).forEach(name => {
      console.log(`      • ${name.substring(0, 60)}${name.length > 60 ? '...' : ''}`);
    });
    if (stats.testNames.length > 3) {
      console.log(`      ... and ${stats.testNames.length - 3} more`);
    }
  }
});

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('\n📊 TOTAL TEST CASE COUNT:\n');
console.log(`   ✅ Active Test Cases: ${totalActiveTests}`);
console.log(`   ⏭️  Skipped Test Cases: ${totalSkippedTests}`);
console.log(`   📝 Total Test Cases: ${totalTests}`);
console.log('\n═══════════════════════════════════════════════════════════════');

// Check for TC numbers
const tcNumbers = new Set();
allTestNames.forEach(name => {
  const tcMatch = name.match(/TC\d+/i);
  if (tcMatch) {
    tcNumbers.add(tcMatch[0]);
  }
});

if (tcNumbers.size > 0) {
  console.log(`\n🔢 Unique TC Numbers: ${tcNumbers.size}`);
  console.log(`   Range: ${Array.from(tcNumbers).sort().slice(0, 5).join(', ')}...`);
}

console.log('\n💡 Note: When running on Chrome only (after config change),');
console.log('   you will execute exactly ' + totalActiveTests + ' test cases per run.');
console.log('   (Previously: ' + totalActiveTests + ' × 3 browsers = ' + (totalActiveTests * 3) + ' executions)\n');

