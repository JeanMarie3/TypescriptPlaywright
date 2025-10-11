# Quick Setup Guide - MCP Server for Claude Desktop

## ✅ Installation Complete!

Your MCP server has been successfully configured and is ready to use.

## 🔧 Next Steps - Connect to Claude Desktop

### Step 1: Locate Claude Desktop Config File

Open this file in a text editor:
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- Full path: `C:\Users\Jean001\AppData\Roaming\Claude\claude_desktop_config.json`

### Step 2: Add Server Configuration

Add this configuration to your Claude Desktop config file:

```json
{
  "mcpServers": {
    "playwright-test-server": {
      "command": "node",
      "args": ["C:\\Users\\Jean001\\IdeaProjects\\TypescriptPlaywright\\config\\mcp-server.js"],
      "env": {
        "PROJECT_PATH": "C:\\Users\\Jean001\\IdeaProjects\\TypescriptPlaywright"
      }
    }
  }
}
```

**Note:** If you already have other MCP servers configured, just add the "playwright-test-server" entry inside the existing "mcpServers" object.

**⚠️ IMPORTANT:** The MCP server file is now located in the `config/` folder after the project reorganization.

### Step 3: Restart Claude Desktop

Close and reopen Claude Desktop completely for the changes to take effect.

### Step 4: Verify Connection

In Claude Desktop, you should see a small 🔨 hammer icon or indication that MCP tools are available. You can then ask Claude to:

- "Run my Playwright tests"
- "Show me the latest test results"
- "List all test cases"
- "Generate an Allure report"
- "Create a PDF report"

## 🎯 Available Commands

From your terminal, you can also run:

```bash
# Start MCP server manually
npm run mcp:server

# Run tests
npm test

# Generate reports
npm run allure:generate
npm run report:custom
```

## 📋 Available MCP Tools

1. **run_playwright_tests** - Execute tests on Chromium
2. **generate_allure_report** - Create Allure HTML reports
3. **generate_pdf_report** - Generate PDF reports
4. **list_test_cases** - Show all available tests
5. **get_test_results** - Display test execution summary
6. **install_browsers** - Install Chromium browser

## 🐛 Troubleshooting

### If Claude Desktop doesn't show MCP tools:
1. Verify the config file path is correct
2. Check that the JSON is valid (no syntax errors)
3. Make sure Node.js is in your system PATH
4. Restart Claude Desktop completely

### If tests don't run:
1. Install browsers: `npm run install:browsers`
2. Verify tests exist in the `tests/` directory
3. Check that `playwright.config.ts` is configured

## 📚 Documentation

- Full documentation: `MCP_SERVER_README.md`
- MCP Configuration: `mcp-config.json`
- Server code: `mcp-server.js`

## ✨ What's Configured

✅ MCP SDK installed (@modelcontextprotocol/sdk)
✅ MCP server script created (mcp-server.js)
✅ NPM scripts added (mcp:server, mcp:dev)
✅ Configuration file created (mcp-config.json)
✅ Documentation created (MCP_SERVER_README.md)
✅ Server tested and verified working

---

**You're all set! 🎉** The MCP server is ready to integrate with Claude Desktop or other MCP-compatible clients.
