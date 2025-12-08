#!/usr/bin/env node

/**
 * EAOS Validation Script
 *
 * Validates:
 * - JSON schema files
 * - File references in skill loader
 * - Command registry consistency
 * - BEADS schema compliance
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Ajv from 'ajv/dist/2020.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

const ajv = new Ajv({ allErrors: true, strict: false });

let errors = [];
let warnings = [];

// ANSI colors
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function log(type, message) {
  const prefix = type === 'error' ? `${RED}✗${RESET}` :
    type === 'warn' ? `${YELLOW}⚠${RESET}` :
      `${GREEN}✓${RESET}`;
  console.log(`  ${prefix} ${message}`);
}

// =============================================================================
// Validate JSON files
// =============================================================================
function validateJsonFiles() {
  console.log('\nValidating JSON files...');

  const jsonFiles = [
    'manifests/claude_skill.json',
    'manifests/BEADS_SCHEMA.json',
    'manifests/COMMAND_REGISTRY.json',
    'EAOS_REASONING_GRAPH_SCHEMA.json'
  ];

  for (const file of jsonFiles) {
    const filePath = path.join(ROOT_DIR, file);
    if (!fs.existsSync(filePath)) {
      log('error', `Missing: ${file}`);
      errors.push(`Missing JSON file: ${file}`);
      continue;
    }

    try {
      JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      log('success', `Valid JSON: ${file}`);
    } catch (e) {
      log('error', `Invalid JSON: ${file} - ${e.message}`);
      errors.push(`Invalid JSON in ${file}: ${e.message}`);
    }
  }
}

// =============================================================================
// Validate skill loader references
// =============================================================================
function validateSkillLoader() {
  console.log('\nValidating skill loader references...');

  const loaderPath = path.join(ROOT_DIR, 'skills/eaos_skill_loader.claude');
  if (!fs.existsSync(loaderPath)) {
    log('error', 'Skill loader not found');
    errors.push('Missing skills/eaos_skill_loader.claude');
    return;
  }

  const content = fs.readFileSync(loaderPath, 'utf-8');

  // Extract file references (lines starting with '    - ')
  const fileRefs = content.match(/^\s+-\s+(.+\.claude)$/gm) || [];
  const files = fileRefs.map(ref => ref.replace(/^\s+-\s+/, '').trim());

  let found = 0;
  let missing = 0;

  for (const file of files) {
    const filePath = path.join(ROOT_DIR, file);
    if (fs.existsSync(filePath)) {
      found++;
    } else {
      log('error', `Missing referenced file: ${file}`);
      errors.push(`Missing file referenced in skill loader: ${file}`);
      missing++;
    }
  }

  if (missing === 0) {
    log('success', `All ${found} referenced files exist`);
  } else {
    log('warn', `${found} found, ${missing} missing`);
  }
}

// =============================================================================
// Validate manifest structure
// =============================================================================
function validateManifest() {
  console.log('\nValidating manifest structure...');

  const manifestPath = path.join(ROOT_DIR, 'manifests/claude_skill.json');
  if (!fs.existsSync(manifestPath)) {
    log('error', 'Manifest not found');
    errors.push('Missing manifests/claude_skill.json');
    return;
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    // Required fields
    const required = ['name', 'description', 'version', 'entrypoint', 'modules'];
    for (const field of required) {
      if (!manifest[field]) {
        log('error', `Missing required field: ${field}`);
        errors.push(`Manifest missing required field: ${field}`);
      }
    }

    // Validate entrypoint exists
    if (manifest.entrypoint) {
      const entryPath = path.join(ROOT_DIR, manifest.entrypoint);
      if (!fs.existsSync(entryPath)) {
        log('error', `Entrypoint not found: ${manifest.entrypoint}`);
        errors.push(`Manifest entrypoint missing: ${manifest.entrypoint}`);
      } else {
        log('success', 'Entrypoint exists');
      }
    }

    // Validate module directories
    if (manifest.modules && Array.isArray(manifest.modules)) {
      for (const mod of manifest.modules) {
        const modPath = path.join(ROOT_DIR, mod);
        if (!fs.existsSync(modPath)) {
          log('warn', `Module directory not found: ${mod}`);
          warnings.push(`Module directory missing: ${mod}`);
        }
      }
      log('success', `${manifest.modules.length} module paths defined`);
    }

    log('success', 'Manifest structure valid');
  } catch (e) {
    log('error', `Manifest validation failed: ${e.message}`);
    errors.push(`Manifest validation error: ${e.message}`);
  }
}

// =============================================================================
// Validate command registry
// =============================================================================
function validateCommandRegistry() {
  console.log('\nValidating command registry...');

  const registryPath = path.join(ROOT_DIR, 'manifests/COMMAND_REGISTRY.json');
  if (!fs.existsSync(registryPath)) {
    log('warn', 'Command registry not found');
    warnings.push('Command registry missing');
    return;
  }

  try {
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));

    let commandCount = 0;
    for (const category of Object.values(registry.commands || {})) {
      commandCount += Object.keys(category).length;
    }

    log('success', `${commandCount} commands registered`);

    // Check for duplicate commands
    const allCommands = [];
    for (const category of Object.values(registry.commands || {})) {
      allCommands.push(...Object.keys(category));
    }

    const duplicates = allCommands.filter((cmd, idx) => allCommands.indexOf(cmd) !== idx);
    if (duplicates.length > 0) {
      log('warn', `Duplicate commands found: ${duplicates.join(', ')}`);
      warnings.push(`Duplicate commands: ${duplicates.join(', ')}`);
    } else {
      log('success', 'No duplicate commands');
    }
  } catch (e) {
    log('error', `Command registry validation failed: ${e.message}`);
    errors.push(`Command registry error: ${e.message}`);
  }
}

// =============================================================================
// Validate BEADS schema
// =============================================================================
function validateBeadsSchema() {
  console.log('\nValidating BEADS schema...');

  const schemaPath = path.join(ROOT_DIR, 'manifests/BEADS_SCHEMA.json');
  if (!fs.existsSync(schemaPath)) {
    log('warn', 'BEADS schema not found');
    warnings.push('BEADS schema missing');
    return;
  }

  try {
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
    const validate = ajv.compile(schema);

    // Test with a sample BEAD
    const sampleBead = {
      id: 'bead-001',
      title: 'Test BEAD',
      description: 'This is a test BEAD for validation',
      category: 'feat',
      priority: 'P2',
      status: 'open',
      created_at: new Date().toISOString(),
      acceptance_criteria: ['AC1', 'AC2']
    };

    const valid = validate(sampleBead);
    if (valid) {
      log('success', 'BEADS schema is valid');
    } else {
      log('error', `BEADS schema validation failed: ${ajv.errorsText(validate.errors)}`);
      errors.push('BEADS schema validation failed');
    }
  } catch (e) {
    log('error', `BEADS schema error: ${e.message}`);
    errors.push(`BEADS schema error: ${e.message}`);
  }
}

// =============================================================================
// Validate directory structure
// =============================================================================
function validateDirectoryStructure() {
  console.log('\nValidating directory structure...');

  const requiredDirs = [
    'agents',
    'core',
    'modules',
    'executive',
    'finance',
    'sales',
    'marketing',
    'compliance',
    'cli',
    'manifests',
    'tests',
    'skills'
  ];

  let found = 0;
  for (const dir of requiredDirs) {
    const dirPath = path.join(ROOT_DIR, dir);
    if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
      found++;
    } else {
      log('error', `Missing directory: ${dir}/`);
      errors.push(`Missing required directory: ${dir}`);
    }
  }

  if (found === requiredDirs.length) {
    log('success', `All ${requiredDirs.length} required directories exist`);
  }
}

// =============================================================================
// Main
// =============================================================================
console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║              EAOS Validation Suite                        ║');
console.log('╚═══════════════════════════════════════════════════════════╝');

validateDirectoryStructure();
validateJsonFiles();
validateManifest();
validateSkillLoader();
validateCommandRegistry();
validateBeadsSchema();

// Summary
console.log('\n' + '─'.repeat(60));
console.log('Summary');
console.log('─'.repeat(60));

if (errors.length === 0 && warnings.length === 0) {
  console.log(`${GREEN}✓ All validations passed${RESET}`);
  process.exit(0);
} else {
  if (errors.length > 0) {
    console.log(`${RED}✗ ${errors.length} error(s) found${RESET}`);
    errors.forEach(e => console.log(`  - ${e}`));
  }
  if (warnings.length > 0) {
    console.log(`${YELLOW}⚠ ${warnings.length} warning(s) found${RESET}`);
    warnings.forEach(w => console.log(`  - ${w}`));
  }

  if (errors.length > 0) {
    process.exit(1);
  }
  process.exit(0);
}
