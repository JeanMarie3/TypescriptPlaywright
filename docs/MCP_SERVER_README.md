# Playwright Test Framework MCP Server

This MCP (Model Context Protocol) server provides AI assistants with tools to manage and execute Playwright tests, generate reports, and analyze test results.

## 🚀 Features

The MCP server exposes the following tools:

1. **run_playwright_tests** - Execute Playwright tests on Chromium browser
2. **generate_allure_report** - Generate Allure HTML reports from test results
3. **generate_pdf_report** - Create custom PDF reports
4. **list_test_cases** - List all available test cases
5. **get_test_results** - Get a summary of the latest test execution
6. **install_browsers** - Install Chromium browser for Playwright

## 📦 Installation

The MCP server is already configured! The required dependencies have been installed:

```bash
npm install @modelcontextprotocol/sdk
```

## ⚙️ Configuration

### For Claude Desktop

Add this configuration to your Claude Desktop config file:

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "playwright-test-server": {
      "command": "node",
      "args": ["C:\\Users\\Jean001\\IdeaProjects\\TypescriptPlaywright\\mcp-server.js"],
      "env": {
        "PROJECT_PATH": "C:\\Users\\Jean001\\IdeaProjects\\TypescriptPlaywright"
      }
    }
  }
}
```

### For Other MCP Clients

Use the `mcp-config.json` file in this directory as a reference.

## 🎯 Usage

### Starting the Server

You can start the MCP server using npm:

```bash
npm run mcp:server
```

Or directly with node:

```bash
node mcp-server.js
```

### Available NPM Scripts

- `npm run mcp:server` - Start the MCP server
- `npm run mcp:dev` - Start the MCP server in development mode

## 🔧 How It Works

The MCP server communicates via stdio (standard input/output) and provides tools that AI assistants can call to:

- Run your Playwright tests
- Generate various types of reports (Allure, PDF, custom)
- Analyze test results
- List available test cases
- Install required browsers

## 📝 Example AI Interactions

Once configured, you can ask Claude (or other MCP-compatible AI assistants):

- "Run all my Playwright tests"
- "Generate an Allure report from the latest test run"
- "What test cases do I have?"
- "Show me the latest test results"
- "Create a PDF report of my test results"
- "Install Chromium browser"

## 🔍 Tool Details

### run_playwright_tests
- **Input:** `testFile` (optional) - specific test file to run
- **Output:** Test execution results

### generate_allure_report
- **Input:** None
- **Output:** Confirmation that Allure report was generated

### generate_pdf_report
- **Input:** `type` (optional) - "custom", "allure", or "allure-complete"
- **Output:** Confirmation that PDF report was generated

### list_test_cases
- **Input:** None
- **Output:** List of all test cases with their file names

### get_test_results
- **Input:** None
- **Output:** Summary of test results (passed, failed, skipped, broken, pass rate)

### install_browsers
- **Input:** None
- **Output:** Confirmation that Chromium browser was installed

## 🛠️ Troubleshooting

### Server not starting
- Ensure Node.js is installed and in your PATH
- Check that all dependencies are installed: `npm install`
- Verify the PROJECT_PATH environment variable is set correctly

### Tests not running
- Make sure Playwright browsers are installed: `npm run install:browsers`
- Check that your test files are in the `tests` directory
- Verify your `playwright.config.ts` is properly configured

### Reports not generating
- Ensure test results exist in `allure-results` directory
- Run tests first before generating reports
- Check that Allure is properly installed: `npm list allure-commandline`

## 📚 Related Documentation

- [MCP Overview](https://modelcontextprotocol.io/)
- [Playwright Documentation](https://playwright.dev/)
- [Allure Reports](https://docs.qameta.io/allure/)

## 🤝 Integration with CI/CD

The MCP server can be used locally for development and testing. For CI/CD pipelines, continue using your existing npm scripts:

- `npm test` - Run tests in CI
- `npm run allure:generate` - Generate reports in CI
- `npm run allure:pdf` - Create PDF reports in CI

## 📄 License

ISC

---

**Note:** This MCP server is designed to work with the Playwright Test Framework in this repository. Make sure all paths in the configuration match your local setup.

