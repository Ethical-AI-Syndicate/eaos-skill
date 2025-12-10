/**
 * EAOS Autonomy Module Unit Tests
 *
 * Tests for core/autonomy.js covering:
 * - AutonomyEngine lifecycle
 * - Cycle execution
 * - Trigger system
 * - State management
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

import {
  AutonomyEngine,
  Trigger,
  ENGINE_STATES,
  CYCLE_TYPES,
  HDM_LEVELS,
  DAILY_TASKS,
  WEEKLY_TASKS,
  MONTHLY_TASKS,
  createAutonomyEngine,
} from '../../core/autonomy.js';
import { createEventBus } from '../../core/events.js';
import { createPluginManager } from '../../core/plugins.js';

// =============================================================================
// Test Setup
// =============================================================================

let testDir;

async function setupTestDir() {
  testDir = path.join(os.tmpdir(), `eaos-autonomy-test-${Date.now()}`);
  await fs.ensureDir(testDir);
  await fs.ensureDir(path.join(testDir, 'plugins'));
  return testDir;
}

async function cleanupTestDir() {
  if (testDir) {
    await fs.remove(testDir);
  }
}

// =============================================================================
// Trigger Tests
// =============================================================================

describe('Trigger', () => {

  test('should create trigger from config', () => {
    const trigger = new Trigger({
      id: 'test-trigger',
      name: 'Test Trigger',
      type: 'event',
      pattern: 'test:*',
      action: 'testAction',
      hdmLevel: 1,
    });

    assert.strictEqual(trigger.id, 'test-trigger');
    assert.strictEqual(trigger.name, 'Test Trigger');
    assert.strictEqual(trigger.type, 'event');
    assert.ok(trigger.enabled);
    assert.strictEqual(trigger.fireCount, 0);
  });

  test('should match event patterns', () => {
    const trigger = new Trigger({
      id: 'pattern',
      name: 'Pattern',
      type: 'event',
      pattern: 'git:pr:*',
      action: 'handle',
    });

    assert.ok(trigger.matches({ event: 'git:pr:merge' }));
    assert.ok(trigger.matches({ event: 'git:pr:close' }));
    assert.ok(!trigger.matches({ event: 'git:commit' }));
  });

  test('should match exact patterns', () => {
    const trigger = new Trigger({
      id: 'exact',
      name: 'Exact',
      type: 'event',
      pattern: 'specific:event',
      action: 'handle',
    });

    assert.ok(trigger.matches({ event: 'specific:event' }));
    assert.ok(!trigger.matches({ event: 'other:event' }));
  });

  test('should match condition functions', () => {
    const trigger = new Trigger({
      id: 'condition',
      name: 'Condition',
      type: 'condition',
      pattern: (event) => event.data?.value > 10,
      action: 'handle',
    });

    assert.ok(trigger.matches({ event: 'test', data: { value: 15 } }));
    assert.ok(!trigger.matches({ event: 'test', data: { value: 5 } }));
  });

  test('should not match when disabled', () => {
    const trigger = new Trigger({
      id: 'disabled',
      name: 'Disabled',
      type: 'event',
      pattern: '*',
      action: 'handle',
      enabled: false,
    });

    assert.ok(!trigger.matches({ event: 'any' }));
  });

  test('should track fire count', () => {
    const trigger = new Trigger({
      id: 'fire',
      name: 'Fire',
      type: 'event',
      pattern: '*',
      action: 'handle',
    });

    assert.strictEqual(trigger.fireCount, 0);
    trigger.fire();
    assert.strictEqual(trigger.fireCount, 1);
    trigger.fire();
    assert.strictEqual(trigger.fireCount, 2);
    assert.ok(trigger.lastFired);
  });

  test('toJSON should serialize trigger', () => {
    const trigger = new Trigger({
      id: 'json',
      name: 'JSON',
      type: 'event',
      pattern: 'test',
      action: 'handle',
      hdmLevel: 2,
    });
    trigger.fire();

    const json = trigger.toJSON();

    assert.strictEqual(json.id, 'json');
    assert.strictEqual(json.name, 'JSON');
    assert.strictEqual(json.hdmLevel, 2);
    assert.strictEqual(json.fireCount, 1);
    assert.ok(json.lastFired);
  });

});

// =============================================================================
// AutonomyEngine Tests
// =============================================================================

describe('AutonomyEngine', () => {

  beforeEach(async () => {
    await setupTestDir();
  });

  afterEach(async () => {
    await cleanupTestDir();
  });

  test('should create engine with defaults', () => {
    const engine = createAutonomyEngine({ rootDir: testDir });

    assert.strictEqual(engine.state, ENGINE_STATES.STOPPED);
    assert.strictEqual(engine.hdmLevel, HDM_LEVELS.CONFIRM);
  });

  test('should create engine with custom options', () => {
    const eventBus = createEventBus();
    const pluginManager = createPluginManager();

    const engine = createAutonomyEngine({
      rootDir: testDir,
      eventBus,
      pluginManager,
      hdmLevel: HDM_LEVELS.NOTIFY,
    });

    assert.strictEqual(engine.eventBus, eventBus);
    assert.strictEqual(engine.pluginManager, pluginManager);
    assert.strictEqual(engine.hdmLevel, HDM_LEVELS.NOTIFY);
  });

  test('should initialize and create directories', async () => {
    const engine = createAutonomyEngine({ rootDir: testDir });
    await engine.initialize();

    assert.ok(await fs.pathExists(path.join(testDir, '.eaos', 'autonomy')));
    assert.ok(await fs.pathExists(path.join(testDir, '.eaos', 'autonomy', 'logs')));
  });

  test('should register default triggers', async () => {
    const engine = createAutonomyEngine({ rootDir: testDir });
    await engine.initialize();

    const triggers = engine.getTriggers();
    assert.ok(triggers.length > 0);
    assert.ok(triggers.some(t => t.id === 'pr-merge'));
    assert.ok(triggers.some(t => t.id === 'error-spike'));
  });

  test('should register custom trigger', async () => {
    const engine = createAutonomyEngine({ rootDir: testDir });
    await engine.initialize();

    const trigger = engine.registerTrigger({
      id: 'custom',
      name: 'Custom Trigger',
      type: 'event',
      pattern: 'custom:event',
      action: 'customAction',
    });

    assert.strictEqual(trigger.id, 'custom');
    assert.ok(engine.triggers.has('custom'));
  });

  test('should unregister trigger', async () => {
    const engine = createAutonomyEngine({ rootDir: testDir });
    await engine.initialize();

    engine.registerTrigger({
      id: 'temporary',
      name: 'Temp',
      type: 'event',
      pattern: '*',
      action: 'handle',
    });

    assert.ok(engine.triggers.has('temporary'));
    engine.unregisterTrigger('temporary');
    assert.ok(!engine.triggers.has('temporary'));
  });

  test('should start and change state', async () => {
    const engine = createAutonomyEngine({ rootDir: testDir });
    await engine.initialize();
    await engine.start();

    assert.strictEqual(engine.state, ENGINE_STATES.RUNNING);
  });

  test('should stop and change state', async () => {
    const engine = createAutonomyEngine({ rootDir: testDir });
    await engine.initialize();
    await engine.start();
    await engine.stop();

    assert.strictEqual(engine.state, ENGINE_STATES.STOPPED);
  });

  test('should pause and resume', async () => {
    const engine = createAutonomyEngine({ rootDir: testDir });
    await engine.initialize();
    await engine.start();

    await engine.pause();
    assert.strictEqual(engine.state, ENGINE_STATES.PAUSED);

    await engine.resume();
    assert.strictEqual(engine.state, ENGINE_STATES.RUNNING);

    await engine.stop();
  });

  test('should get tasks for cycle type', async () => {
    const engine = createAutonomyEngine({ rootDir: testDir });

    const dailyTasks = engine.getTasksForCycle(CYCLE_TYPES.DAILY);
    const weeklyTasks = engine.getTasksForCycle(CYCLE_TYPES.WEEKLY);
    const monthlyTasks = engine.getTasksForCycle(CYCLE_TYPES.MONTHLY);

    assert.deepStrictEqual(dailyTasks, DAILY_TASKS);
    assert.deepStrictEqual(weeklyTasks, WEEKLY_TASKS);
    assert.deepStrictEqual(monthlyTasks, MONTHLY_TASKS);
  });

  test('should run cycle manually with force', async () => {
    const engine = createAutonomyEngine({ rootDir: testDir });
    await engine.initialize();

    // Don't start engine, use force
    const report = await engine.runCycle(CYCLE_TYPES.DAILY, { force: true });

    assert.ok(report);
    assert.strictEqual(report.type, CYCLE_TYPES.DAILY);
    assert.ok(report.startTime);
    assert.ok(report.endTime);
    assert.ok(report.tasks.length > 0);
  });

  test('should not run cycle when stopped without force', async () => {
    const engine = createAutonomyEngine({ rootDir: testDir });
    await engine.initialize();

    const report = await engine.runCycle(CYCLE_TYPES.DAILY);

    assert.strictEqual(report, null);
  });

  test('should save cycle report', async () => {
    const engine = createAutonomyEngine({ rootDir: testDir });
    await engine.initialize();

    await engine.runCycle(CYCLE_TYPES.DAILY, { force: true });

    const lastReportPath = path.join(testDir, '.eaos', 'autonomy', 'last_cycle_report.json');
    assert.ok(await fs.pathExists(lastReportPath));
  });

  test('should save and restore state', async () => {
    const engine = createAutonomyEngine({ rootDir: testDir });
    await engine.initialize();
    await engine.runCycle(CYCLE_TYPES.DAILY, { force: true });
    await engine.saveState();

    // Create new engine and verify state loaded
    const engine2 = createAutonomyEngine({ rootDir: testDir });
    await engine2.initialize();

    assert.ok(engine2.lastCycleRun.daily);
    assert.ok(engine2.cycleHistory.length > 0);
  });

  test('should get status', async () => {
    const engine = createAutonomyEngine({ rootDir: testDir });
    await engine.initialize();

    const status = engine.getStatus();

    assert.strictEqual(status.state, ENGINE_STATES.STOPPED);
    assert.strictEqual(status.hdmLevel, HDM_LEVELS.CONFIRM);
    assert.ok(status.triggers);
    assert.ok(status.plugins);
  });

  test('should get logs', async () => {
    const engine = createAutonomyEngine({ rootDir: testDir });
    await engine.initialize();

    await engine.runCycle(CYCLE_TYPES.DAILY, { force: true });
    await engine.runCycle(CYCLE_TYPES.WEEKLY, { force: true });

    const allLogs = engine.getLogs();
    assert.strictEqual(allLogs.length, 2);

    const dailyLogs = engine.getLogs({ type: CYCLE_TYPES.DAILY });
    assert.strictEqual(dailyLogs.length, 1);
  });

  test('should execute task with retry on timeout', async () => {
    const engine = createAutonomyEngine({ rootDir: testDir });
    await engine.initialize();

    const task = { id: 'test-task', name: 'Test Task', hdmLevel: 0 };
    const result = await engine.executeTask(task, 'test-cycle');

    assert.strictEqual(result.status, 'completed');
    assert.ok(result.output);
  });

  test('should skip tasks requiring higher HDM level', async () => {
    const engine = createAutonomyEngine({
      rootDir: testDir,
      hdmLevel: HDM_LEVELS.NOTIFY, // Level 1
    });
    await engine.initialize();

    const report = await engine.runCycle(CYCLE_TYPES.MONTHLY, { force: true });

    // Monthly tasks have hdmLevel 2, should be skipped
    const skipped = report.tasks.filter(t => t.status === 'skipped');
    assert.ok(skipped.length > 0);
  });

});

// =============================================================================
// Constants Tests
// =============================================================================

describe('Autonomy Constants', () => {

  test('ENGINE_STATES should have all states', () => {
    assert.strictEqual(ENGINE_STATES.STOPPED, 'stopped');
    assert.strictEqual(ENGINE_STATES.RUNNING, 'running');
    assert.strictEqual(ENGINE_STATES.PAUSED, 'paused');
    assert.strictEqual(ENGINE_STATES.ERROR, 'error');
  });

  test('CYCLE_TYPES should have all types', () => {
    assert.strictEqual(CYCLE_TYPES.DAILY, 'daily');
    assert.strictEqual(CYCLE_TYPES.WEEKLY, 'weekly');
    assert.strictEqual(CYCLE_TYPES.MONTHLY, 'monthly');
    assert.strictEqual(CYCLE_TYPES.MANUAL, 'manual');
  });

  test('HDM_LEVELS should have all levels', () => {
    assert.strictEqual(HDM_LEVELS.INFORMATIONAL, 0);
    assert.strictEqual(HDM_LEVELS.NOTIFY, 1);
    assert.strictEqual(HDM_LEVELS.CONFIRM, 2);
    assert.strictEqual(HDM_LEVELS.APPROVE, 3);
    assert.strictEqual(HDM_LEVELS.CRITICAL, 4);
  });

  test('DAILY_TASKS should be defined', () => {
    assert.ok(Array.isArray(DAILY_TASKS));
    assert.ok(DAILY_TASKS.length > 0);
    assert.ok(DAILY_TASKS.every(t => t.id && t.name));
  });

  test('WEEKLY_TASKS should be defined', () => {
    assert.ok(Array.isArray(WEEKLY_TASKS));
    assert.ok(WEEKLY_TASKS.length > 0);
  });

  test('MONTHLY_TASKS should be defined', () => {
    assert.ok(Array.isArray(MONTHLY_TASKS));
    assert.ok(MONTHLY_TASKS.length > 0);
  });

});

// =============================================================================
// Integration Tests
// =============================================================================

describe('Autonomy Integration', () => {

  beforeEach(async () => {
    await setupTestDir();
  });

  afterEach(async () => {
    await cleanupTestDir();
  });

  test('should emit events during cycle', async () => {
    const eventBus = createEventBus();
    const engine = createAutonomyEngine({
      rootDir: testDir,
      eventBus,
    });
    await engine.initialize();

    const events = [];
    eventBus.on('autonomy:*', (e) => events.push(e.event));

    await engine.runCycle(CYCLE_TYPES.DAILY, { force: true });

    assert.ok(events.includes('autonomy:cycle:start'));
    assert.ok(events.includes('autonomy:cycle:end'));
  });

  test('should work with plugin manager', async () => {
    const pluginManager = createPluginManager();
    await pluginManager.initialize(testDir);

    const engine = createAutonomyEngine({
      rootDir: testDir,
      pluginManager,
    });
    await engine.initialize();

    const report = await engine.runCycle(CYCLE_TYPES.DAILY, { force: true });

    assert.ok(report);
    assert.strictEqual(report.status, 'completed');
  });

});
