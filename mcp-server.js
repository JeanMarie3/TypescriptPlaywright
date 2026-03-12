#!/usr/bin/env node

/**
 * Playwright Test Framework MCP Server
 * Provides tools for running tests, generating reports, and managing test cases
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_PATH = process.env.PROJECT_PATH || __dirname;

// Create MCP server
const server = new Server(
  {
    name: 'playwright-test-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'run_playwright_tests',
        description: 'Run Playwright tests on Chromium browser',
        inputSchema: {
          type: 'object',
          properties: {
            testFile: {
              type: 'string',
              description: 'Specific test file to run (optional, runs all if not specified)',
            },
          },
        },
      },
      {
        name: 'generate_allure_report',
        description: 'Generate Allure HTML report from test results',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'generate_pdf_report',
        description: 'Generate custom PDF report from test results',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['custom', 'allure', 'allure-complete'],
              description: 'Type of PDF report to generate',
            },
          },
        },
      },
      {
        name: 'list_test_cases',
        description: 'List all test cases with their TC numbers',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_test_results',
        description: 'Get latest test execution results summary',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'install_browsers',
        description: 'Install Chromium browser for Playwright',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'run_playwright_tests': {
        const testFile = args.testFile || '';
        const command = testFile
          ? `npm run test:chromium -- ${testFile}`
          : 'npm test';

        const output = execSync(command, {
          cwd: PROJECT_PATH,
          encoding: 'utf8',
          maxBuffer: 10 * 1024 * 1024,
        });

        return {
          content: [
            {
              type: 'text',
              text: `✅ Tests executed successfully!\n\n${output}`,
            },
          ],
        };
      }

      case 'generate_allure_report': {
        const output = execSync('npm run allure:generate', {
          cwd: PROJECT_PATH,
          encoding: 'utf8',
        });

        return {
          content: [
            {
              type: 'text',
              text: `✅ Allure report generated!\n\n${output}\n\nOpen with: npm run allure:open`,
            },
          ],
        };
      }

      case 'generate_pdf_report': {
        const type = args.type || 'custom';
        let command;

        switch (type) {
          case 'custom':
            command = 'npm run report:custom';
            break;
          case 'allure':
            command = 'npm run allure:pdf';
            break;
          case 'allure-complete':
            command = 'npm run allure:pdf';
            break;
          default:
            command = 'npm run report:custom';
        }

        const output = execSync(command, {
          cwd: PROJECT_PATH,
          encoding: 'utf8',
          maxBuffer: 10 * 1024 * 1024,
        });

        return {
          content: [
            {
              type: 'text',
              text: `✅ PDF report generated!\n\n${output}`,
            },
          ],
        };
      }

      case 'list_test_cases': {
        const testsDir = path.join(PROJECT_PATH, 'tests');
        const testFiles = fs.readdirSync(testsDir).filter(f => f.endsWith('.spec.ts'));

        let testCases = [];

        for (const file of testFiles) {
          const content = fs.readFileSync(path.join(testsDir, file), 'utf8');
          const matches = content.matchAll(/test\(['"]([^'"]+)['"]/g);

          for (const match of matches) {
            testCases.push(`${file}: ${match[1]}`);
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: `📋 Test Cases (${testCases.length} total):\n\n${testCases.join('\n')}`,
            },
          ],
        };
      }

      case 'get_test_results': {
        const resultsDir = path.join(PROJECT_PATH, 'allure-results');

        if (!fs.existsSync(resultsDir)) {
          return {
            content: [
              {
                type: 'text',
                text: '⚠️ No test results found. Run tests first with: npm test',
              },
            ],
          };
        }

        const files = fs.readdirSync(resultsDir);
        const resultFiles = files.filter(f => f.endsWith('-result.json'));

        let passed = 0, failed = 0, skipped = 0, broken = 0;

        for (const file of resultFiles) {
          const content = JSON.parse(fs.readFileSync(path.join(resultsDir, file), 'utf8'));

          if (content.status === 'passed') passed++;
          else if (content.status === 'failed') failed++;
          else if (content.status === 'skipped') skipped++;
          else if (content.status === 'broken') broken++;
        }

        const total = resultFiles.length;
        const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;

        return {
          content: [
            {
              type: 'text',
              text: `📊 Latest Test Results:\n\n` +
                    `Total: ${total}\n` +
                    `✅ Passed: ${passed}\n` +
                    `❌ Failed: ${failed}\n` +
                    `💔 Broken: ${broken}\n` +
                    `⏭️  Skipped: ${skipped}\n` +
                    `📈 Pass Rate: ${passRate}%`,
            },
          ],
        };
      }

      case 'install_browsers': {
        const output = execSync('npm run install:browsers', {
          cwd: PROJECT_PATH,
          encoding: 'utf8',
        });

        return {
          content: [
            {
              type: 'text',
              text: `✅ Chromium browser installed!\n\n${output}`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error: ${error.message}\n\n${error.stack}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Playwright Test MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});

