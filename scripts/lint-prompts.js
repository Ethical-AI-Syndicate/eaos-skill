#!/usr/bin/env node

/**
 * EAOS Prompt Linter
 *
 * Validates .claude files for:
 * - Required sections (Purpose, Safety, Output schema)
 * - No hardcoded secrets
 * - No dangerous commands
 * - Proper structure
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

// ANSI colors
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

// Load config
let config;
try {
  config = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, '.prompt-lint.json'), 'utf-8'));
} catch (e) {
  config = { rules: {} };
}

const errors = [];
const warnings = [];

// =============================================================================
// Lint Rules
// =============================================================================

function checkHeader(content, _filePath) {
  // Check for markdown header
  if (!content.match(/^#\s+.+/m)) {
    return { severity: 'error', message: 'Missing header (# Title)' };
  }
  return null;
}

function checkPurpose(content, filePath) {
  // Check for purpose/description section
  const hasPurpose = content.match(/##\s*(Purpose|Description|Overview)/i) ||
                     content.match(/\*\*Purpose\*\*/i);
  if (!hasPurpose && filePath.includes('agents/')) {
    return { severity: 'error', message: 'Missing Purpose section' };
  }
  return null;
}

function checkOutputSchema(content, filePath) {
  // Check for output schema definition
  const hasOutput = content.match(/##\s*(Output|Response|Returns)/i) ||
                    content.match(/\*\*Output\*\*/i) ||
                    content.match(/```(json|yaml)/i);
  if (!hasOutput && filePath.includes('agents/')) {
    return { severity: 'warning', message: 'Missing Output schema definition' };
  }
  return null;
}

function checkSafetyConstraints(content, filePath) {
  // Check for safety constraints
  const hasSafety = content.match(/##\s*(Safety|Constraints|Guardrails|Rules)/i) ||
                    content.match(/\*\*Safety\*\*/i) ||
                    content.match(/NEVER|MUST NOT|DO NOT|FORBIDDEN/i);
  if (!hasSafety && (filePath.includes('agents/') || filePath.includes('core/'))) {
    return { severity: 'warning', message: 'Consider adding explicit safety constraints' };
  }
  return null;
}

function checkMaxLength(content, _filePath) {
  const lines = content.split('\n').length;
  const maxLines = config.rules['max-prompt-length']?.maxLines || 500;
  if (lines > maxLines) {
    return { severity: 'warning', message: `File exceeds ${maxLines} lines (${lines} lines)` };
  }
  return null;
}

function checkNoSecrets(content, _filePath) {
  const patterns = config.rules['no-hardcoded-secrets']?.patterns || [];
  for (const pattern of patterns) {
    const regex = new RegExp(pattern, 'i');
    if (regex.test(content)) {
      return { severity: 'error', message: 'Possible hardcoded secret detected' };
    }
  }
  return null;
}

function checkNoDangerousCommands(content, _filePath) {
  const patterns = config.rules['no-dangerous-commands']?.patterns || [];
  for (const pattern of patterns) {
    const regex = new RegExp(pattern, 'i');
    if (regex.test(content)) {
      return { severity: 'error', message: `Dangerous command pattern detected: ${pattern}` };
    }
  }
  return null;
}

function checkApprovalLevels(content, _filePath) {
  // Check if critical operations mention approval levels
  const hasCritical = content.match(/critical|destructive|production|deploy/i);
  const hasApproval = content.match(/approval|L[1-5]|human.*review|escalate/i);
  if (hasCritical && !hasApproval) {
    return { severity: 'warning', message: 'Critical operations should specify approval level' };
  }
  return null;
}

// =============================================================================
// Main Linter
// =============================================================================

async function lintFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(ROOT_DIR, filePath);
  const results = [];

  const checks = [
    checkHeader,
    checkPurpose,
    checkOutputSchema,
    checkSafetyConstraints,
    checkMaxLength,
    checkNoSecrets,
    checkNoDangerousCommands,
    checkApprovalLevels
  ];

  for (const check of checks) {
    const result = check(content, filePath);
    if (result) {
      results.push({ ...result, file: relativePath });
    }
  }

  return results;
}

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║              EAOS Prompt Linter                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  // Find all .claude files
  const patterns = [
    'agents/**/*.claude',
    'core/**/*.claude',
    'modules/**/*.claude',
    'compliance/**/*.claude',
    'skills/**/*.claude',
    'executive/**/*.claude',
    'finance/**/*.claude',
    'sales/**/*.claude',
    'marketing/**/*.claude'
  ];

  const files = [];
  for (const pattern of patterns) {
    const matches = await glob(pattern, { cwd: ROOT_DIR });
    files.push(...matches.map(f => path.join(ROOT_DIR, f)));
  }

  console.log(`Scanning ${files.length} .claude files...\n`);

  let errorCount = 0;
  let warningCount = 0;
  let passCount = 0;

  for (const file of files) {
    const results = await lintFile(file);
    const relativePath = path.relative(ROOT_DIR, file);

    if (results.length === 0) {
      console.log(`${GREEN}✓${RESET} ${relativePath}`);
      passCount++;
    } else {
      const hasError = results.some(r => r.severity === 'error');
      const prefix = hasError ? `${RED}✗${RESET}` : `${YELLOW}⚠${RESET}`;
      console.log(`${prefix} ${relativePath}`);

      for (const result of results) {
        const icon = result.severity === 'error' ? `${RED}✗${RESET}` : `${YELLOW}⚠${RESET}`;
        console.log(`    ${icon} ${result.message}`);

        if (result.severity === 'error') {
          errorCount++;
          errors.push(result);
        } else {
          warningCount++;
          warnings.push(result);
        }
      }

      if (!hasError) passCount++;
    }
  }

  // Summary
  console.log('\n' + '─'.repeat(60));
  console.log('Summary');
  console.log('─'.repeat(60));

  console.log(`Files scanned: ${files.length}`);
  console.log(`${GREEN}✓${RESET} Passed: ${passCount}`);

  if (warningCount > 0) {
    console.log(`${YELLOW}⚠${RESET} Warnings: ${warningCount}`);
  }

  if (errorCount > 0) {
    console.log(`${RED}✗${RESET} Errors: ${errorCount}`);
    console.log(`\n${RED}Lint failed with ${errorCount} error(s)${RESET}`);
    process.exit(1);
  } else if (warningCount > 0) {
    console.log(`\n${YELLOW}Lint passed with ${warningCount} warning(s)${RESET}`);
    process.exit(0);
  } else {
    console.log(`\n${GREEN}✓ All checks passed${RESET}`);
    process.exit(0);
  }
}

main().catch(err => {
  console.error(`${RED}Error: ${err.message}${RESET}`);
  process.exit(1);
});
