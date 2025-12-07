/**
 * EAOS CLI Test Suite
 *
 * Tests the CLI functionality including:
 * - Initialization
 * - Status checks
 * - Command execution
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const CLI_PATH = path.join(ROOT_DIR, 'cli', 'eaos.js');

// Helper to run CLI commands
function runCli(args) {
  try {
    const result = execSync(`node ${CLI_PATH} ${args}`, {
      cwd: ROOT_DIR,
      encoding: 'utf-8',
      timeout: 30000
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, output: error.stdout || error.message };
  }
}

describe('EAOS CLI', () => {

  test('should show help when no command provided', () => {
    const result = runCli('--help');
    assert.ok(result.success, 'Help command should succeed');
    assert.ok(result.output.includes('Enterprise AI Operating System'), 'Should show description');
  });

  test('should show version', () => {
    const result = runCli('--version');
    assert.ok(result.success, 'Version command should succeed');
    assert.match(result.output.trim(), /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/, 'Should show valid version');
  });

  test('init command should create required files', () => {
    const result = runCli('init --force');
    assert.ok(result.success, 'Init command should succeed');

    // Check files were created
    assert.ok(fs.existsSync(path.join(ROOT_DIR, 'memory', 'state.json')), 'State file should exist');
    assert.ok(fs.existsSync(path.join(ROOT_DIR, 'memory', 'reasoning_graph.json')), 'Graph file should exist');
    assert.ok(fs.existsSync(path.join(ROOT_DIR, '.eaos.config.json')), 'Config file should exist');
  });

  test('status command should show system status', () => {
    const result = runCli('status');
    assert.ok(result.success, 'Status command should succeed');
    assert.ok(result.output.includes('System Status'), 'Should show status header');
  });

  test('audit quick command should complete', () => {
    const result = runCli('audit quick');
    assert.ok(result.success, 'Audit quick should succeed');
    // Check for "audit" in output - the completion message contains this
    assert.ok(
      result.output.toLowerCase().includes('audit'),
      'Should show audit in output'
    );
  });

  test('beads list command should work', () => {
    const result = runCli('beads list');
    assert.ok(result.success, 'Beads list should succeed');
  });

  test('memory summary command should work after init', () => {
    // First ensure init has run
    runCli('init');
    const result = runCli('memory summary');
    assert.ok(result.success, 'Memory summary should succeed');
  });

  test('autonomy status should show disabled', () => {
    const result = runCli('autonomy status');
    assert.ok(result.success, 'Autonomy status should succeed');
    assert.ok(result.output.includes('Disabled'), 'Should show disabled');
  });

});

describe('Validation Scripts', () => {

  test('validate.js should run successfully', () => {
    const result = execSync(`node ${path.join(ROOT_DIR, 'scripts', 'validate.js')}`, {
      cwd: ROOT_DIR,
      encoding: 'utf-8'
    });
    assert.ok(result.includes('Validation'), 'Should show validation header');
  });

});

describe('File Structure', () => {

  test('required directories should exist', () => {
    const requiredDirs = ['agents', 'core', 'modules', 'compliance', 'cli', 'manifests'];
    for (const dir of requiredDirs) {
      assert.ok(fs.existsSync(path.join(ROOT_DIR, dir)), `${dir}/ should exist`);
    }
  });

  test('manifest should be valid JSON', () => {
    const manifestPath = path.join(ROOT_DIR, 'manifests', 'claude_skill.json');
    assert.ok(fs.existsSync(manifestPath), 'Manifest should exist');

    const content = fs.readFileSync(manifestPath, 'utf-8');
    assert.doesNotThrow(() => JSON.parse(content), 'Manifest should be valid JSON');
  });

  test('skill loader should exist', () => {
    const loaderPath = path.join(ROOT_DIR, 'skills', 'eaos_skill_loader.claude');
    assert.ok(fs.existsSync(loaderPath), 'Skill loader should exist');
  });

});
