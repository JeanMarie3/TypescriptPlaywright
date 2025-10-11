# CI/CD Configuration for Allure Reports

This document explains how to automatically generate and save Allure reports as build artifacts in various CI/CD platforms.

## 🎯 What's Configured

Your framework now has CI/CD configurations for:
1. ✅ **GitHub Actions** (`.github/workflows/playwright-allure.yml`)
2. ✅ **GitLab CI** (`.gitlab-ci.yml`)
3. ✅ **Azure DevOps** (`azure-pipelines.yml`)

## 📦 What Gets Saved as Artifacts

Every CI/CD run will automatically save:

| Artifact | Description | Format | Retention |
|----------|-------------|--------|-----------|
| **allure-report-html** | Full interactive HTML report | Folder | 30 days |
| **allure-report-pdf** | PDF version of report | PDF file | 30 days |
| **allure-report-package** | Complete report in ZIP | ZIP file | 30 days |
| **allure-results** | Raw test result data | JSON files | 30 days |
| **playwright-report** | Built-in Playwright HTML report | Folder | 30 days |
| **test-artifacts** | Screenshots & Videos | PNG/WebM files | 30 days |

---

## 🚀 GitHub Actions Setup

### File: `.github/workflows/playwright-allure.yml`

### How to Use:

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Add CI/CD with Allure reporting"
   git push origin main
   ```

2. **Automatic Triggers:**
   - ✅ Push to `main`, `master`, or `develop` branches
   - ✅ Pull requests to these branches
   - ✅ Manual trigger from GitHub Actions UI

3. **View Artifacts:**
   - Go to your GitHub repository
   - Click on **Actions** tab
   - Click on any workflow run
   - Scroll down to **Artifacts** section
   - Download any artifact you need

4. **View Report Online (GitHub Pages):**
   - If pushed to `main` branch, report is automatically deployed to GitHub Pages
   - Access at: `https://<your-username>.github.io/<repo-name>/allure-report`

### Enable GitHub Pages (Optional):
1. Go to repository **Settings** → **Pages**
2. Source: **GitHub Actions**
3. Save

---

## 🦊 GitLab CI Setup

### File: `.gitlab-ci.yml`

### How to Use:

1. **Push to GitLab**
   ```bash
   git add .
   git commit -m "Add GitLab CI with Allure reporting"
   git push origin main
   ```

2. **Automatic Triggers:**
   - ✅ Push to any branch
   - ✅ Merge requests

3. **Download Artifacts:**
   - Go to your GitLab project
   - Click **CI/CD** → **Pipelines**
   - Click on the pipeline run
   - Click **Download** artifacts button on the right

4. **View Report Online (GitLab Pages):**
   - Automatically deployed to GitLab Pages on `main`/`master` branch
   - Access at: `https://<username>.gitlab.io/<project-name>`

---

## ☁️ Azure DevOps Setup

### File: `azure-pipelines.yml`

### How to Use:

1. **Create Pipeline in Azure DevOps:**
   - Go to **Pipelines** → **New Pipeline**
   - Select your repository
   - Choose **Existing Azure Pipelines YAML file**
   - Select `azure-pipelines.yml`
   - Run the pipeline

2. **View Artifacts:**
   - Open your pipeline run
   - Click on **Summary** tab
   - Scroll to **Published** section
   - Click on any artifact to download

3. **View Test Results:**
   - Click on **Tests** tab
   - See detailed test results with pass/fail statistics

---

## 🎨 What Happens in CI/CD Pipeline

### Step-by-Step Process:

1. **Checkout Code** - Gets your latest code
2. **Setup Node.js** - Installs Node.js 18
3. **Install Dependencies** - Runs `npm ci`
4. **Install Browsers** - Installs Chromium only (faster)
5. **Run Tests** - Executes `npm run test:chromium`
6. **Generate Allure Report** - Creates HTML report from results
7. **Generate PDF** - Creates PDF version of report
8. **Package Report** - Creates ZIP file with complete report
9. **Upload Artifacts** - Saves all reports for download
10. **Deploy to Pages** (optional) - Publishes report online

### Key Features:

✅ **Always runs** - Even if tests fail, reports are still generated  
✅ **Parallel execution** - Tests run in parallel for speed  
✅ **Multiple formats** - HTML, PDF, and ZIP  
✅ **30-day retention** - Artifacts kept for 30 days  
✅ **Screenshots included** - All test screenshots saved  
✅ **Videos on failure** - Failed tests include video recordings  

---

## 📊 Accessing Your Reports

### After Pipeline Runs:

#### **GitHub Actions:**
```
Repository → Actions → Click workflow run → Artifacts section
```

#### **GitLab CI:**
```
Project → CI/CD → Pipelines → Click pipeline → Download artifacts
```

#### **Azure DevOps:**
```
Pipelines → Click build → Summary → Published artifacts
```

### Report Formats Available:

1. **HTML (Interactive)** - Full Allure report with charts
   - Download and extract
   - Run: `npx http-server allure-report`
   - Open in browser

2. **PDF (Shareable)** - Static PDF document
   - Download and open directly
   - Share via email or attach to tickets

3. **ZIP Package (Complete)** - Everything in one file
   - Download and extract
   - Self-contained, ready to view

---

## 🔧 Customization Options

### Change Retention Period:

**GitHub Actions:**
```yaml
retention-days: 30  # Change to 7, 14, 90, etc.
```

**GitLab CI:**
```yaml
expire_in: 30 days  # Change to 1 week, 2 weeks, etc.
```

### Run on Different Branches:

**GitHub Actions:**
```yaml
on:
  push:
    branches: [ main, develop, feature/* ]  # Add your branches
```

**GitLab CI:**
```yaml
only:
  - main
  - develop
  - /^feature-.*$/  # Regex patterns
```

### Test Multiple Browsers:

Change `test:chromium` to `test` in the pipeline scripts to run on all browsers.

---

## 🐛 Troubleshooting

### Pipeline Fails at "Install Browsers"
**Solution:** The workflow already includes `--with-deps` flag. If issues persist, use the official Playwright Docker image.

### Artifacts Not Showing
**Solution:** Check that `if: always()` is present in upload steps. This ensures artifacts upload even if tests fail.

### PDF Generation Fails
**Solution:** PDF generation has `continue-on-error: true`, so it won't break the pipeline. Check logs for specific errors.

### Report Not Deploying to Pages
**Solution:** 
- GitHub: Enable GitHub Pages in repository settings
- GitLab: Check that `pages` job is in the pipeline
- Ensure you're pushing to `main` or `master` branch

---

## 📈 Benefits

✅ **Historical Data** - Keep reports from every build  
✅ **Regression Tracking** - Compare current vs previous runs  
✅ **Easy Sharing** - Download and share with team  
✅ **Bug Reports** - Attach to JIRA/tickets directly  
✅ **Compliance** - Audit trail of test executions  
✅ **No Manual Steps** - Everything automated  

---

## 🎯 Quick Start Checklist

- [ ] Choose your CI/CD platform (GitHub/GitLab/Azure)
- [ ] Push the corresponding YAML file to your repository
- [ ] Configure the pipeline in your CI/CD platform
- [ ] Push code to trigger first run
- [ ] Download artifacts after pipeline completes
- [ ] (Optional) Enable Pages for online report viewing

---

## 📞 Need Help?

- Check pipeline logs for detailed error messages
- Ensure `package.json` scripts are correct
- Verify browsers are installing properly
- Test locally first with `npm run test:allure:package`

Your CI/CD is now configured to automatically generate and save Allure reports! 🎉

