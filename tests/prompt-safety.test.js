/**
 * EAOS Prompt Safety Tests
 *
 * Tests prompt files for safety issues:
 * - No hardcoded secrets or credentials
 * - No dangerous system commands
 * - Proper safety constraints defined
 * - Approval levels for critical operations
 * - No prompt injection vulnerabilities
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

// =============================================================================
// Test Data
// =============================================================================

// Patterns that should NOT appear in prompts
const FORBIDDEN_PATTERNS = {
  secrets: [
    /api[_-]?key\s*[=:]\s*['"][^'"]+['"]/gi,
    /password\s*[=:]\s*['"][^'"]+['"]/gi,
    /secret\s*[=:]\s*['"][^'"]+['"]/gi,
    /token\s*[=:]\s*['"][^'"]+['"]/gi,
    /private[_-]?key\s*[=:]/gi,
    /AWS_SECRET/gi,
    /ANTHROPIC_API_KEY\s*=/gi
  ],
  dangerousCommands: [
    /rm\s+-rf\s+\//gi,
    /sudo\s+rm/gi,
    />\s*\/dev\/sd[a-z]/gi,
    /mkfs\./gi,
    /dd\s+if=.*of=\/dev/gi,
    /:(){ :|:& };:/g,  // Fork bomb
    /wget.*\|\s*sh/gi,
    /curl.*\|\s*bash/gi
  ],
  sqlInjection: [
    /DROP\s+DATABASE/gi,
    /DROP\s+TABLE/gi,
    /DELETE\s+FROM.*WHERE\s+1\s*=\s*1/gi,
    /TRUNCATE\s+TABLE/gi
    // Note: SQL comment pattern removed - too many false positives with markdown
  ],
  promptInjection: [
    /ignore\s+(all\s+)?previous\s+instructions/gi,
    /disregard\s+(all\s+)?prior\s+(instructions|rules)/gi,
    /forget\s+everything/gi,
    /you\s+are\s+now\s+DAN/gi,
    /jailbreak/gi
  ]
};

// Required safety elements
const REQUIRED_SAFETY_ELEMENTS = {
  agents: [
    /NEVER|MUST NOT|DO NOT|FORBIDDEN|PROHIBITED/i,
    /safety|constraint|guardrail|rule|limit/i
  ],
  core: [
    /approval|authorize|permission/i,
    /validate|verify|check/i,
    /level|state|mode|status/i,  // state management keywords
    /kernel|engine|manager/i     // core component keywords
  ]
};

// =============================================================================
// Helper Functions
// =============================================================================

async function getClaudeFiles() {
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
  return files;
}

function checkPatterns(content, patterns) {
  const matches = [];
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      matches.push({ pattern: pattern.toString(), match: match[0] });
    }
  }
  return matches;
}

// =============================================================================
// Secret Detection Tests
// =============================================================================

describe('Secret Detection', () => {

  test('no hardcoded secrets in .claude files', async () => {
    const files = await getClaudeFiles();
    const violations = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const matches = checkPatterns(content, FORBIDDEN_PATTERNS.secrets);

      if (matches.length > 0) {
        violations.push({
          file: path.relative(ROOT_DIR, file),
          matches
        });
      }
    }

    assert.strictEqual(
      violations.length,
      0,
      `Found potential secrets in: ${violations.map(v => v.file).join(', ')}`
    );
  });

  test('no hardcoded secrets in JavaScript files', async () => {
    const jsFiles = await glob('**/*.js', {
      cwd: ROOT_DIR,
      ignore: ['node_modules/**', 'tests/prompt-safety.test.js']  // Exclude self
    });

    const violations = [];

    for (const file of jsFiles) {
      const content = fs.readFileSync(path.join(ROOT_DIR, file), 'utf-8');
      const matches = checkPatterns(content, FORBIDDEN_PATTERNS.secrets);

      if (matches.length > 0) {
        violations.push({ file, matches });
      }
    }

    assert.strictEqual(
      violations.length,
      0,
      `Found potential secrets in JS files: ${violations.map(v => v.file).join(', ')}`
    );
  });

});

// =============================================================================
// Dangerous Command Tests
// =============================================================================

describe('Dangerous Command Detection', () => {

  test('no dangerous system commands in prompts', async () => {
    const files = await getClaudeFiles();
    const violations = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const matches = checkPatterns(content, FORBIDDEN_PATTERNS.dangerousCommands);

      if (matches.length > 0) {
        violations.push({
          file: path.relative(ROOT_DIR, file),
          matches
        });
      }
    }

    assert.strictEqual(
      violations.length,
      0,
      `Found dangerous commands in: ${violations.map(v => `${v.file}: ${v.matches.map(m => m.match).join(', ')}`).join('; ')}`
    );
  });

  test('no SQL injection patterns', async () => {
    const files = await getClaudeFiles();
    const violations = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const matches = checkPatterns(content, FORBIDDEN_PATTERNS.sqlInjection);

      if (matches.length > 0) {
        violations.push({
          file: path.relative(ROOT_DIR, file),
          matches
        });
      }
    }

    assert.strictEqual(
      violations.length,
      0,
      `Found SQL injection patterns in: ${violations.map(v => v.file).join(', ')}`
    );
  });

});

// =============================================================================
// Prompt Injection Tests
// =============================================================================

describe('Prompt Injection Prevention', () => {

  test('no prompt injection patterns in .claude files', async () => {
    const files = await getClaudeFiles();
    const violations = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const matches = checkPatterns(content, FORBIDDEN_PATTERNS.promptInjection);

      if (matches.length > 0) {
        violations.push({
          file: path.relative(ROOT_DIR, file),
          matches
        });
      }
    }

    assert.strictEqual(
      violations.length,
      0,
      `Found prompt injection patterns in: ${violations.map(v => v.file).join(', ')}`
    );
  });

});

// =============================================================================
// Safety Constraint Tests
// =============================================================================

describe('Safety Constraints', () => {

  test('agent files should have safety constraints', async () => {
    const agentFiles = await glob('agents/**/*.claude', { cwd: ROOT_DIR });
    const missingConstraints = [];

    for (const file of agentFiles) {
      const content = fs.readFileSync(path.join(ROOT_DIR, file), 'utf-8');

      // Check for safety-related content
      const hasSafetyKeywords = REQUIRED_SAFETY_ELEMENTS.agents.some(
        pattern => pattern.test(content)
      );

      if (!hasSafetyKeywords) {
        missingConstraints.push(file);
      }
    }

    // Allow some files to not have explicit safety (like personas)
    const criticalMissing = missingConstraints.filter(
      f => !f.includes('personas')
    );

    assert.strictEqual(
      criticalMissing.length,
      0,
      `Agent files missing safety constraints: ${criticalMissing.join(', ')}`
    );
  });

  test('core files should have validation/approval patterns', async () => {
    const coreFiles = await glob('core/**/*.claude', { cwd: ROOT_DIR });
    const missingValidation = [];

    for (const file of coreFiles) {
      const content = fs.readFileSync(path.join(ROOT_DIR, file), 'utf-8');

      const hasValidation = REQUIRED_SAFETY_ELEMENTS.core.some(
        pattern => pattern.test(content)
      );

      if (!hasValidation) {
        missingValidation.push(file);
      }
    }

    // Most core files should have validation
    assert.ok(
      missingValidation.length < coreFiles.length / 2,
      `Too many core files missing validation: ${missingValidation.join(', ')}`
    );
  });

});

// =============================================================================
// Approval Level Tests
// =============================================================================

describe('Approval Level Coverage', () => {

  test('autonomy mode should require high approval', async () => {
    const autonomyFile = path.join(ROOT_DIR, 'core/autonomy_mode.claude');
    const content = fs.readFileSync(autonomyFile, 'utf-8');

    // Check for approval level mentions
    const hasApprovalMention = /L[3-5]|Level\s*[3-5]|escalat|board|executive/i.test(content);

    assert.ok(
      hasApprovalMention,
      'Autonomy mode should mention high approval levels (L3+)'
    );
  });

  test('human decision matrix should define approval levels', async () => {
    const hdmFile = path.join(ROOT_DIR, 'core/human_decision_matrix.claude');
    const content = fs.readFileSync(hdmFile, 'utf-8');

    // Check for approval levels (HDM uses 0-4 scale)
    let levelsFound = 0;
    for (let level = 0; level <= 4; level++) {
      const hasLevel = new RegExp(`Level\\s*${level}`, 'i').test(content);
      if (hasLevel) levelsFound++;
    }
    assert.ok(levelsFound >= 3, `Human Decision Matrix should define at least 3 approval levels, found ${levelsFound}`);
  });

});

// =============================================================================
// Content Length and Complexity Tests
// =============================================================================

describe('Prompt Complexity', () => {

  test('prompts should not be excessively long', async () => {
    const files = await getClaudeFiles();
    const longFiles = [];
    const MAX_LINES = 500;

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n').length;

      if (lines > MAX_LINES) {
        longFiles.push({ file: path.relative(ROOT_DIR, file), lines });
      }
    }

    // Warn but don't fail for long files
    if (longFiles.length > 0) {
      console.log(`Warning: ${longFiles.length} files exceed ${MAX_LINES} lines`);
      for (const { file, lines } of longFiles) {
        console.log(`  - ${file}: ${lines} lines`);
      }
    }

    // Only fail if too many are long
    assert.ok(
      longFiles.length < 5,
      `Too many files exceed ${MAX_LINES} lines: ${longFiles.map(f => f.file).join(', ')}`
    );
  });

});
