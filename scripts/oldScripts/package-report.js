const path = require('path');
const fs = require('fs-extra');
const archiver = require('archiver');

(async () => {
  console.log('📦 Packaging Allure Report...');

  const reportDir = path.join(__dirname, 'allure-report');
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const zipPath = path.join(__dirname, `allure-report-${timestamp}.zip`);

  // Check if report exists
  if (!fs.existsSync(reportDir)) {
    console.error('❌ Error: allure-report folder not found. Generate the report first with: npm run allure:generate');
    process.exit(1);
  }

  // Create a write stream for the zip file
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', {
    zlib: { level: 9 } // Maximum compression
  });

  // Listen for warnings and errors
  archive.on('warning', (err) => {
    if (err.code === 'ENOENT') {
      console.warn('⚠️ Warning:', err.message);
    } else {
      throw err;
    }
  });

  archive.on('error', (err) => {
    throw err;
  });

  // Track progress
  output.on('close', () => {
    const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
    console.log(`✅ Report packaged successfully!`);
    console.log(`📁 Location: ${zipPath}`);
    console.log(`📊 Size: ${sizeInMB} MB`);
    console.log(`\n💡 To use:`);
    console.log(`   1. Extract the zip file`);
    console.log(`   2. Open index.html in any browser`);
    console.log(`   3. Or run: npx http-server ./allure-report`);
  });

  // Pipe archive data to the file
  archive.pipe(output);

  // Append files from the allure-report directory
  archive.directory(reportDir, false);

  // Finalize the archive
  await archive.finalize();
})();

