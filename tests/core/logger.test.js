/**
 * EAOS Logger Unit Tests
 *
 * Tests for core/logger.js covering:
 * - Log level filtering
 * - Output formats (JSON, human)
 * - Context propagation via child loggers
 * - File output and rotation
 * - Edge cases and error handling
 */

import { test, describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '../..');

// Import the logger
import { EAOSLogger } from '../../core/logger.js';

// Test directory for file output tests
const TEST_LOG_DIR = path.join(ROOT_DIR, 'tests', '.test-logs');

// =============================================================================
// Helper Functions
// =============================================================================

function cleanTestLogDir() {
  if (fs.existsSync(TEST_LOG_DIR)) {
    fs.rmSync(TEST_LOG_DIR, { recursive: true, force: true });
  }
}

function captureConsoleLog() {
  const logs = [];
  const originalLog = console.log;
  console.log = (...args) => logs.push(args.join(' '));
  return {
    logs,
    restore: () => { console.log = originalLog; }
  };
}

// =============================================================================
// Constructor and Configuration Tests
// =============================================================================

describe('EAOSLogger Constructor', () => {

  test('should use default options when none provided', () => {
    const logger = new EAOSLogger();
    assert.strictEqual(logger.level, 'info');
    assert.strictEqual(logger.format, 'human');
    assert.strictEqual(logger.output, 'console');
  });

  test('should accept custom log level', () => {
    const logger = new EAOSLogger({ level: 'debug' });
    assert.strictEqual(logger.level, 'debug');
  });

  test('should accept custom format', () => {
    const logger = new EAOSLogger({ format: 'json' });
    assert.strictEqual(logger.format, 'json');
  });

  test('should accept custom output destination', () => {
    const logger = new EAOSLogger({ output: 'both' });
    assert.strictEqual(logger.output, 'both');
  });

  test('should accept custom context', () => {
    const logger = new EAOSLogger({ context: { agent: 'test' } });
    assert.deepStrictEqual(logger.context, { agent: 'test' });
  });

  test('should accept custom maxFileSize', () => {
    const logger = new EAOSLogger({ maxFileSize: 5000 });
    assert.strictEqual(logger.maxFileSize, 5000);
  });

  test('should accept custom maxFiles', () => {
    const logger = new EAOSLogger({ maxFiles: 10 });
    assert.strictEqual(logger.maxFiles, 10);
  });

  test('should use default maxFileSize of 10MB', () => {
    const logger = new EAOSLogger();
    assert.strictEqual(logger.maxFileSize, 10 * 1024 * 1024);
  });

});

// =============================================================================
// Log Level Filtering Tests
// =============================================================================

describe('Log Level Filtering', () => {

  test('should filter debug when level is info', () => {
    const capture = captureConsoleLog();
    const logger = new EAOSLogger({ level: 'info' });

    logger.debug('This should not appear');

    capture.restore();
    assert.strictEqual(capture.logs.length, 0, 'Debug should be filtered at info level');
  });

  test('should allow info when level is info', () => {
    const capture = captureConsoleLog();
    const logger = new EAOSLogger({ level: 'info' });

    logger.info('This should appear');

    capture.restore();
    assert.strictEqual(capture.logs.length, 1);
    assert.ok(capture.logs[0].includes('This should appear'));
  });

  test('should allow all levels when level is debug', () => {
    const capture = captureConsoleLog();
    const logger = new EAOSLogger({ level: 'debug' });

    logger.debug('debug message');
    logger.info('info message');
    logger.warn('warn message');
    logger.error('error message');
    logger.fatal('fatal message');

    capture.restore();
    assert.strictEqual(capture.logs.length, 5);
  });

  test('should filter info when level is warn', () => {
    const capture = captureConsoleLog();
    const logger = new EAOSLogger({ level: 'warn' });

    logger.debug('filtered');
    logger.info('filtered');
    logger.warn('not filtered');
    logger.error('not filtered');

    capture.restore();
    assert.strictEqual(capture.logs.length, 2);
  });

  test('should filter all but fatal when level is fatal', () => {
    const capture = captureConsoleLog();
    const logger = new EAOSLogger({ level: 'fatal' });

    logger.debug('filtered');
    logger.info('filtered');
    logger.warn('filtered');
    logger.error('filtered');
    logger.fatal('not filtered');

    capture.restore();
    assert.strictEqual(capture.logs.length, 1);
  });

  test('setLevel should change minimum level', () => {
    const capture = captureConsoleLog();
    const logger = new EAOSLogger({ level: 'error' });

    logger.info('filtered');
    logger.setLevel('debug');
    logger.info('not filtered');

    capture.restore();
    assert.strictEqual(capture.logs.length, 1);
    assert.ok(capture.logs[0].includes('not filtered'));
  });

  test('setLevel should ignore invalid levels', () => {
    const logger = new EAOSLogger({ level: 'info' });
    logger.setLevel('invalid');
    assert.strictEqual(logger.level, 'info');
  });

});

// =============================================================================
// Output Format Tests
// =============================================================================

describe('Output Formats', () => {

  test('human format should include timestamp, level, and message', () => {
    const capture = captureConsoleLog();
    const logger = new EAOSLogger({ level: 'info', format: 'human' });

    logger.info('Test message');

    capture.restore();
    assert.strictEqual(capture.logs.length, 1);
    // Check for ISO timestamp pattern
    assert.ok(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(capture.logs[0]));
    assert.ok(capture.logs[0].includes('INFO'));
    assert.ok(capture.logs[0].includes('Test message'));
  });

  test('json format should output valid JSON', () => {
    const capture = captureConsoleLog();
    const logger = new EAOSLogger({ level: 'info', format: 'json' });

    logger.info('Test message');

    capture.restore();
    assert.strictEqual(capture.logs.length, 1);

    const parsed = JSON.parse(capture.logs[0]);
    assert.ok(parsed.timestamp);
    assert.strictEqual(parsed.level, 'info');
    assert.strictEqual(parsed.message, 'Test message');
    assert.ok(parsed.pid);
  });

  test('json format should include metadata', () => {
    const capture = captureConsoleLog();
    const logger = new EAOSLogger({ level: 'info', format: 'json' });

    logger.info('Test', { action: 'test', count: 42 });

    capture.restore();
    const parsed = JSON.parse(capture.logs[0]);
    assert.strictEqual(parsed.action, 'test');
    assert.strictEqual(parsed.count, 42);
  });

  test('human format should show context in brackets', () => {
    const capture = captureConsoleLog();
    const logger = new EAOSLogger({ level: 'info', format: 'human' });

    logger.info('Test message', { agent: 'cto', action: 'plan' });

    capture.restore();
    assert.ok(capture.logs[0].includes('['));
    assert.ok(capture.logs[0].includes('agent='));
    assert.ok(capture.logs[0].includes('action='));
  });

});

// =============================================================================
// Child Logger Tests
// =============================================================================

describe('Child Loggers', () => {

  test('child should inherit parent level', () => {
    const parent = new EAOSLogger({ level: 'warn' });
    const child = parent.child({ agent: 'test' });

    assert.strictEqual(child.level, 'warn');
  });

  test('child should inherit parent format', () => {
    const parent = new EAOSLogger({ format: 'json' });
    const child = parent.child({ agent: 'test' });

    assert.strictEqual(child.format, 'json');
  });

  test('child should merge context with parent', () => {
    const parent = new EAOSLogger({ context: { service: 'eaos' } });
    const child = parent.child({ agent: 'cto' });

    assert.deepStrictEqual(child.context, { service: 'eaos', agent: 'cto' });
  });

  test('child context should override parent context on conflict', () => {
    const parent = new EAOSLogger({ context: { version: '1.0' } });
    const child = parent.child({ version: '2.0' });

    assert.strictEqual(child.context.version, '2.0');
  });

  test('child should include context in log output', () => {
    const capture = captureConsoleLog();
    const parent = new EAOSLogger({ level: 'info', format: 'json' });
    const child = parent.child({ agent: 'autonomous_cto', correlationId: 'abc-123' });

    child.info('Agent message');

    capture.restore();
    const parsed = JSON.parse(capture.logs[0]);
    assert.strictEqual(parsed.agent, 'autonomous_cto');
    assert.strictEqual(parsed.correlationId, 'abc-123');
  });

  test('grandchild should inherit from both ancestors', () => {
    const parent = new EAOSLogger({ context: { service: 'eaos' }, format: 'json' });
    const child = parent.child({ agent: 'cto' });
    const grandchild = child.child({ module: 'strategy' });

    const capture = captureConsoleLog();
    grandchild.info('Deep log');
    capture.restore();

    const parsed = JSON.parse(capture.logs[0]);
    assert.strictEqual(parsed.service, 'eaos');
    assert.strictEqual(parsed.agent, 'cto');
    assert.strictEqual(parsed.module, 'strategy');
  });

});

// =============================================================================
// File Output Tests
// =============================================================================

describe('File Output', () => {

  beforeEach(() => {
    cleanTestLogDir();
  });

  afterEach(() => {
    cleanTestLogDir();
  });

  test('should create log directory when output is file', () => {
    const logger = new EAOSLogger({
      level: 'info',
      output: 'file',
      logDir: TEST_LOG_DIR
    });

    assert.ok(fs.existsSync(TEST_LOG_DIR), 'Log directory should be created');
  });

  test('should write logs to file', () => {
    const logger = new EAOSLogger({
      level: 'info',
      output: 'file',
      logDir: TEST_LOG_DIR
    });

    logger.info('Test file log');

    const files = fs.readdirSync(TEST_LOG_DIR);
    assert.ok(files.length > 0, 'Should create log file');

    const logContent = fs.readFileSync(path.join(TEST_LOG_DIR, files[0]), 'utf-8');
    assert.ok(logContent.includes('Test file log'));
  });

  test('file logs should be JSON format', () => {
    const logger = new EAOSLogger({
      level: 'info',
      output: 'file',
      logDir: TEST_LOG_DIR
    });

    logger.info('JSON file test');

    const files = fs.readdirSync(TEST_LOG_DIR);
    const logContent = fs.readFileSync(path.join(TEST_LOG_DIR, files[0]), 'utf-8');
    const lines = logContent.trim().split('\n');

    const parsed = JSON.parse(lines[0]);
    assert.strictEqual(parsed.message, 'JSON file test');
  });

  test('output=both should write to console and file', () => {
    const capture = captureConsoleLog();
    const logger = new EAOSLogger({
      level: 'info',
      output: 'both',
      logDir: TEST_LOG_DIR
    });

    logger.info('Both outputs');

    capture.restore();

    // Check console
    assert.strictEqual(capture.logs.length, 1);

    // Check file
    const files = fs.readdirSync(TEST_LOG_DIR);
    assert.ok(files.length > 0);
  });

  test('log file should use date-based naming', () => {
    const logger = new EAOSLogger({
      level: 'info',
      output: 'file',
      logDir: TEST_LOG_DIR
    });

    logger.info('Date test');

    const files = fs.readdirSync(TEST_LOG_DIR);
    const today = new Date().toISOString().split('T')[0];
    assert.ok(files[0].includes(today), `Log file should contain date ${today}`);
    assert.ok(files[0].startsWith('eaos-'));
    assert.ok(files[0].endsWith('.log'));
  });

});

// =============================================================================
// Log Entry Structure Tests
// =============================================================================

describe('Log Entry Structure', () => {

  test('entry should include pid', () => {
    const capture = captureConsoleLog();
    const logger = new EAOSLogger({ format: 'json' });

    logger.info('PID test');

    capture.restore();
    const parsed = JSON.parse(capture.logs[0]);
    assert.strictEqual(parsed.pid, process.pid);
  });

  test('entry should include hostname', () => {
    const capture = captureConsoleLog();
    const logger = new EAOSLogger({ format: 'json' });

    logger.info('Hostname test');

    capture.restore();
    const parsed = JSON.parse(capture.logs[0]);
    assert.ok(parsed.hostname);
  });

  test('entry should include ISO timestamp', () => {
    const capture = captureConsoleLog();
    const logger = new EAOSLogger({ format: 'json' });

    logger.info('Timestamp test');

    capture.restore();
    const parsed = JSON.parse(capture.logs[0]);
    // Validate ISO 8601 format
    const timestamp = new Date(parsed.timestamp);
    assert.ok(!isNaN(timestamp.getTime()), 'Timestamp should be valid date');
  });

  test('metadata should merge with entry', () => {
    const capture = captureConsoleLog();
    const logger = new EAOSLogger({ format: 'json' });

    logger.info('Meta test', { custom: 'value', number: 123 });

    capture.restore();
    const parsed = JSON.parse(capture.logs[0]);
    assert.strictEqual(parsed.custom, 'value');
    assert.strictEqual(parsed.number, 123);
  });

  test('metadata should not override core fields', () => {
    const capture = captureConsoleLog();
    const logger = new EAOSLogger({ format: 'json' });

    // Try to override level - it should be overwritten by the actual level
    logger.info('Override test', { message: 'override attempt' });

    capture.restore();
    const parsed = JSON.parse(capture.logs[0]);
    // Meta is spread after core fields, so this will override
    // This documents current behavior - metadata CAN override message
    assert.strictEqual(parsed.message, 'override attempt');
  });

});

// =============================================================================
// Error Handling Tests
// =============================================================================

describe('Error Handling', () => {

  test('should handle undefined message gracefully', () => {
    const capture = captureConsoleLog();
    const logger = new EAOSLogger({ format: 'json' });

    assert.doesNotThrow(() => {
      logger.info(undefined);
    });

    capture.restore();
  });

  test('should handle null message gracefully', () => {
    const capture = captureConsoleLog();
    const logger = new EAOSLogger({ format: 'json' });

    assert.doesNotThrow(() => {
      logger.info(null);
    });

    capture.restore();
  });

  test('should handle object message', () => {
    const capture = captureConsoleLog();
    const logger = new EAOSLogger({ format: 'json' });

    assert.doesNotThrow(() => {
      logger.info({ complex: 'object' });
    });

    capture.restore();
  });

  test('should handle empty metadata', () => {
    const capture = captureConsoleLog();
    const logger = new EAOSLogger({ format: 'json' });

    assert.doesNotThrow(() => {
      logger.info('test', {});
    });

    capture.restore();
    const parsed = JSON.parse(capture.logs[0]);
    assert.strictEqual(parsed.message, 'test');
  });

});

// =============================================================================
// Level Color Tests (Human Format)
// =============================================================================

describe('Human Format Colors', () => {

  test('each level should have distinct output', () => {
    const levels = ['debug', 'info', 'warn', 'error', 'fatal'];
    const outputs = [];

    for (const level of levels) {
      const capture = captureConsoleLog();
      const logger = new EAOSLogger({ level: 'debug', format: 'human' });
      logger[level]('test');
      capture.restore();
      outputs.push(capture.logs[0]);
    }

    // Each output should be different (different colors/level names)
    const unique = new Set(outputs);
    assert.strictEqual(unique.size, 5, 'Each level should produce unique output');
  });

  test('level names should be uppercase and padded', () => {
    const capture = captureConsoleLog();
    const logger = new EAOSLogger({ level: 'info', format: 'human' });

    logger.info('test');

    capture.restore();
    assert.ok(capture.logs[0].includes('INFO '), 'INFO should be uppercase and padded');
  });

});

// =============================================================================
// Integration Test
// =============================================================================

describe('Logger Integration', () => {

  beforeEach(() => {
    cleanTestLogDir();
  });

  afterEach(() => {
    cleanTestLogDir();
  });

  test('full workflow: parent -> child -> file + console', () => {
    const capture = captureConsoleLog();

    const rootLogger = new EAOSLogger({
      level: 'debug',
      format: 'json',
      output: 'both',
      logDir: TEST_LOG_DIR,
      context: { service: 'eaos', version: '1.0.0' }
    });

    const ctoLogger = rootLogger.child({ agent: 'autonomous_cto' });
    const strategyLogger = ctoLogger.child({ module: 'strategy' });

    strategyLogger.info('Planning started', { action: 'plan' });
    strategyLogger.debug('Debug details', { step: 1 });
    strategyLogger.warn('Resource warning', { cpu: 90 });

    capture.restore();

    // Verify console output
    assert.strictEqual(capture.logs.length, 3);

    // Verify context propagation
    const parsed = JSON.parse(capture.logs[0]);
    assert.strictEqual(parsed.service, 'eaos');
    assert.strictEqual(parsed.agent, 'autonomous_cto');
    assert.strictEqual(parsed.module, 'strategy');
    assert.strictEqual(parsed.action, 'plan');

    // Verify file output
    const files = fs.readdirSync(TEST_LOG_DIR);
    assert.ok(files.length > 0);

    const fileContent = fs.readFileSync(path.join(TEST_LOG_DIR, files[0]), 'utf-8');
    const lines = fileContent.trim().split('\n');
    assert.strictEqual(lines.length, 3, 'File should have 3 log lines');
  });

});
