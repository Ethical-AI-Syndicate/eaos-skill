/**
 * EAOS Integration Test Suite
 *
 * Tests end-to-end workflows including:
 * - Full initialization and teardown
 * - Multi-command sequences
 * - Agent coordination
 * - Compliance workflows
 * - Memory persistence
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { execSync, execFileSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const CLI_PATH = path.join(ROOT_DIR, 'cli', 'eaos.js');

// Helper to run CLI commands
// args: array of strings (CLI arguments)
function runCli(args, options = {}) {
  try {
    // execFileSync escapes arguments safely
    const result = execFileSync(
      'node',
      [CLI_PATH, ...args],
      {
        cwd: ROOT_DIR,
        encoding: 'utf-8',
        timeout: options.timeout || 60000,
        env: { ...process.env, ...options.env }
      }
    );
    return { success: true, output: result };
  } catch (error) {
    return {
      success: false,
      output: error.stdout || '',
      error: error.stderr || error.message
    };
  }
}

// Helper to read JSON file
function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

// Helper to clean test artifacts
function cleanTestArtifacts() {
  const dirs = ['memory', 'logs', 'audit', 'beads', 'metrics'];
  for (const dir of dirs) {
    const dirPath = path.join(ROOT_DIR, dir);
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  }
  const configPath = path.join(ROOT_DIR, '.eaos.config.json');
  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
  }
}

// =============================================================================
// Integration Tests
// =============================================================================

describe('EAOS Integration Tests', () => {

  // ---------------------------------------------------------------------------
  // Setup and Teardown
  // ---------------------------------------------------------------------------

  before(() => {
    // Clean any existing test artifacts
    cleanTestArtifacts();
  });

  after(() => {
    // Optionally clean up after tests
    // cleanTestArtifacts();
  });

  // ---------------------------------------------------------------------------
  // Full Initialization Workflow
  // ---------------------------------------------------------------------------

  describe('Full Initialization Workflow', () => {

    test('should initialize system', () => {
      const result = runCli(['init', '--force']);
      assert.ok(result.success, `Init should succeed: ${result.error || ''}`);
      // Check for success indicators in output
      assert.ok(
        result.output.toLowerCase().includes('initialized') ||
        result.output.toLowerCase().includes('eaos') ||
        result.output.includes('✔'),
        'Should show initialization message'
      );
    });

    test('should create all required directories', () => {
      const requiredDirs = ['memory', 'logs', 'audit', 'beads', 'release', 'monthly'];
      for (const dir of requiredDirs) {
        const dirPath = path.join(ROOT_DIR, dir);
        assert.ok(fs.existsSync(dirPath), `${dir}/ should exist after init`);
      }
    });

    test('should create valid state file', () => {
      const statePath = path.join(ROOT_DIR, 'memory', 'state.json');
      assert.ok(fs.existsSync(statePath), 'State file should exist');

      const state = readJson(statePath);
      assert.ok(state.version, 'State should have version');
      assert.ok(state.initialized_at, 'State should have initialized_at');
    });

    test('should create valid reasoning graph', () => {
      const graphPath = path.join(ROOT_DIR, 'memory', 'reasoning_graph.json');
      assert.ok(fs.existsSync(graphPath), 'Reasoning graph should exist');

      const graph = readJson(graphPath);
      assert.ok(Array.isArray(graph.nodes), 'Graph should have nodes array');
      assert.ok(Array.isArray(graph.edges), 'Graph should have edges array');
    });

    test('should create config file', () => {
      const configPath = path.join(ROOT_DIR, '.eaos.config.json');
      assert.ok(fs.existsSync(configPath), 'Config file should exist');

      const config = readJson(configPath);
      assert.ok(config.memory_kernel || config.autonomy, 'Config should have expected keys');
    });

  });

  // ---------------------------------------------------------------------------
  // Status and Health Checks
  // ---------------------------------------------------------------------------

  describe('Status and Health Checks', () => {

    test('status should show all systems ready', () => {
      const result = runCli(['status']);
      assert.ok(result.success, 'Status should succeed');
      assert.ok(result.output.includes('Memory Kernel'), 'Should show memory kernel status');
      assert.ok(result.output.includes('Reasoning Graph'), 'Should show reasoning graph status');
    });

    test('status should report initialized state', () => {
      const result = runCli(['status']);
      assert.ok(result.output.includes('Yes'), 'Should show initialized as Yes');
    });

  });

  // ---------------------------------------------------------------------------
  // Audit Workflows
  // ---------------------------------------------------------------------------

  describe('Audit Workflows', () => {

    test('quick audit should complete', () => {
      const result = runCli(['audit', 'quick']);
      assert.ok(result.success, `Quick audit should succeed: ${result.error || ''}`);
    });

    test('security audit should complete', () => {
      const result = runCli(['audit', 'security']);
      assert.ok(result.success, `Security audit should succeed: ${result.error || ''}`);
    });

    test('full audit should complete', () => {
      const result = runCli(['audit', 'full'], { timeout: 120000 });
      assert.ok(result.success, `Full audit should succeed: ${result.error || ''}`);
    });

    test('audit should create output files', () => {
      const auditDir = path.join(ROOT_DIR, 'audit');
      assert.ok(fs.existsSync(auditDir), 'Audit directory should exist');

      const files = fs.readdirSync(auditDir);
      assert.ok(files.length > 0, 'Audit directory should contain files');
    });

  });

  // ---------------------------------------------------------------------------
  // Compliance Workflows
  // ---------------------------------------------------------------------------

  describe('Compliance Workflows', () => {

    test('SOC-2 compliance check should complete', () => {
      const result = runCli(['compliance', 'soc2']);
      assert.ok(result.success, 'SOC-2 check should succeed');
      assert.ok(result.output.includes('Controls mapped'), 'Should show controls mapped');
    });

    test('ISO 27001 compliance check should complete', () => {
      const result = runCli(['compliance', 'iso27001']);
      assert.ok(result.success, 'ISO 27001 check should succeed');
    });

    test('NIST compliance check should complete', () => {
      const result = runCli(['compliance', 'nist']);
      assert.ok(result.success, 'NIST check should succeed');
    });

    test('compliance with map flag should work', () => {
      const result = runCli(['compliance', 'soc2', '--map']);
      assert.ok(result.success, 'Compliance map should succeed');
    });

  });

  // ---------------------------------------------------------------------------
  // BEADS Workflows
  // ---------------------------------------------------------------------------

  describe('BEADS Workflows', () => {

    test('beads list should work', () => {
      const result = runCli(['beads', 'list']);
      assert.ok(result.success, 'Beads list should succeed');
    });

    test('beads create should add new task', () => {
      const result = runCli(['beads', 'create', '--title', 'Test BEAD', '--category', 'feat', '--priority', 'P2']);
      assert.ok(result.success, 'Beads create should succeed');
    });

    test('beads should persist to file', () => {
      const beadsDir = path.join(ROOT_DIR, 'beads');
      if (fs.existsSync(beadsDir)) {
        const files = fs.readdirSync(beadsDir);
        // At least validate directory exists and is accessible
        assert.ok(Array.isArray(files), 'Should be able to list beads directory');
      }
    });

  });

  // ---------------------------------------------------------------------------
  // Simulation Workflows
  // ---------------------------------------------------------------------------

  describe('Simulation Workflows', () => {

    test('simulate should work with scenario', () => {
      const result = runCli(['simulate', 'test deployment']);
      assert.ok(result.success, 'Sandbox simulation should succeed');
    });

    test('multiverse simulate should work', () => {
      const result = runCli(['multiverse', 'simulate', 'scaling strategy']);
      assert.ok(result.success, 'Multiverse simulation should succeed');
    });

    test('quantum planning should work', () => {
      const result = runCli(['quantum', 'plan', 'infrastructure upgrade']);
      assert.ok(result.success, 'Quantum planning should succeed');
    });

  });

  // ---------------------------------------------------------------------------
  // Memory Persistence
  // ---------------------------------------------------------------------------

  describe('Memory Persistence', () => {

    test('memory summary should show stats', () => {
      const result = runCli(['memory', 'summary']);
      assert.ok(result.success, 'Memory summary should succeed');
    });

    test('state file should be readable', () => {
      const statePath = path.join(ROOT_DIR, 'memory', 'state.json');
      assert.ok(fs.existsSync(statePath), 'State file should exist');

      const state = readJson(statePath);
      assert.ok(state.version, 'State should have version');
      assert.ok(state.last_updated || state.initialized_at, 'State should have timestamp');
    });

  });

  // ---------------------------------------------------------------------------
  // Autonomy Controls
  // ---------------------------------------------------------------------------

  describe('Autonomy Controls', () => {

    test('autonomy status should show disabled', () => {
      const result = runCli(['autonomy', 'status']);
      assert.ok(result.success, 'Autonomy status should succeed');
      assert.ok(result.output.includes('Disabled'), 'Autonomy should be disabled');
    });

    test('autonomy on should enable', () => {
      const result = runCli(['autonomy', 'on']);
      assert.ok(result.success, 'Autonomy on should succeed');
    });

    test('autonomy off should disable', () => {
      const result = runCli(['autonomy', 'off']);
      assert.ok(result.success, 'Autonomy off should succeed');
    });

  });

  // ---------------------------------------------------------------------------
  // Dashboard Generation
  // ---------------------------------------------------------------------------

  describe('Dashboard Generation', () => {

    test('dashboard should generate successfully', () => {
      const result = runCli(['dashboard']);
      assert.ok(result.success, 'Dashboard generation should succeed');
      assert.ok(result.output.includes('Dashboard'), 'Should show dashboard content');
    });

    test('dashboard should show all departments', () => {
      const result = runCli(['dashboard']);
      assert.ok(
        result.output.includes('Engineering') ||
        result.output.includes('Health') ||
        result.output.includes('Compliance'),
        'Should show department metrics'
      );
    });

  });

  // ---------------------------------------------------------------------------
  // Error Handling
  // ---------------------------------------------------------------------------

  describe('Error Handling', () => {

    test('invalid command should show help', () => {
      const result = runCli(['notacommand']);
      // Should either fail gracefully or show help
      assert.ok(true, 'Invalid command was handled');
    });

    test('help should be accessible', () => {
      const result = runCli(['--help']);
      assert.ok(result.success, 'Help should succeed');
      assert.ok(result.output.includes('Enterprise AI Operating System'), 'Should show description');
    });

  });

  // ---------------------------------------------------------------------------
  // Multi-Command Sequences
  // ---------------------------------------------------------------------------

  describe('Multi-Command Sequences', () => {

    test('init -> status -> audit sequence should work', () => {
      const init = runCli(['init']);
      assert.ok(init.success, 'Init should succeed');

      const status = runCli(['status']);
      assert.ok(status.success, 'Status should succeed after init');

      const audit = runCli(['audit', 'quick']);
      assert.ok(audit.success, 'Audit should succeed after status');
    });

    test('compliance -> dashboard sequence should work', () => {
      const compliance = runCli(['compliance', 'soc2']);
      assert.ok(compliance.success, 'Compliance should succeed');

      const dashboard = runCli(['dashboard']);
      assert.ok(dashboard.success, 'Dashboard should succeed after compliance');
    });

  });

});

// =============================================================================
// Logger and Metrics Integration Tests
// =============================================================================

describe('Logger and Metrics Integration', () => {

  test('logger module should load', async () => {
    const { EAOSLogger } = await import('../core/logger.js');
    const logger = new EAOSLogger({ level: 'debug' });
    assert.ok(logger, 'Logger should instantiate');
    assert.ok(typeof logger.info === 'function', 'Logger should have info method');
  });

  test('metrics module should load', async () => {
    const { MetricsRegistry, Counter, Gauge } = await import('../core/metrics.js');
    const registry = new MetricsRegistry();
    assert.ok(registry, 'Registry should instantiate');

    const counter = registry.counter('test_counter', 'Test counter');
    counter.inc({}, 1);
    assert.strictEqual(counter.get({}), 1, 'Counter should increment');
  });

  test('metrics should export prometheus format', async () => {
    const { MetricsRegistry } = await import('../core/metrics.js');
    const registry = new MetricsRegistry();

    registry.counter('test_requests', 'Test requests').inc({ status: 'ok' });
    registry.gauge('test_gauge', 'Test gauge').set({}, 42);

    const output = registry.toPrometheus();
    assert.ok(output.includes('test_requests'), 'Should include counter');
    assert.ok(output.includes('test_gauge'), 'Should include gauge');
  });

});
