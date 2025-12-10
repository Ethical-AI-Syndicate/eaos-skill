/**
 * EAOS Plugins Module Unit Tests
 *
 * Tests for core/plugins.js covering:
 * - Plugin class
 * - PluginManager lifecycle
 * - Hook registration and execution
 * - Plugin discovery
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

import {
  Plugin,
  PluginManager,
  PLUGIN_STATES,
  HOOK_TYPES,
  createPluginManager,
} from '../../core/plugins.js';
import { createEventBus } from '../../core/events.js';

// =============================================================================
// Test Setup
// =============================================================================

let testDir;
let pluginsDir;

async function setupTestDir() {
  testDir = path.join(os.tmpdir(), `eaos-plugin-test-${Date.now()}`);
  pluginsDir = path.join(testDir, 'plugins');
  await fs.ensureDir(pluginsDir);
  return testDir;
}

async function cleanupTestDir() {
  if (testDir) {
    await fs.remove(testDir);
  }
}

async function createTestPlugin(id, manifest = {}) {
  const pluginDir = path.join(pluginsDir, id);
  await fs.ensureDir(pluginDir);
  await fs.writeJson(path.join(pluginDir, 'plugin.json'), {
    id,
    name: manifest.name || `Test Plugin ${id}`,
    version: manifest.version || '1.0.0',
    description: manifest.description || 'A test plugin',
    ...manifest,
  });
  return pluginDir;
}

// =============================================================================
// Plugin Class Tests
// =============================================================================

describe('Plugin', () => {

  test('should create plugin from manifest', () => {
    const manifest = {
      id: 'test-plugin',
      name: 'Test Plugin',
      version: '1.0.0',
      description: 'A test plugin',
    };

    const plugin = new Plugin(manifest, '/path/to/plugin');

    assert.strictEqual(plugin.id, 'test-plugin');
    assert.strictEqual(plugin.name, 'Test Plugin');
    assert.strictEqual(plugin.version, '1.0.0');
    assert.strictEqual(plugin.state, PLUGIN_STATES.UNLOADED);
  });

  test('should have default values', () => {
    const manifest = {
      id: 'minimal',
      name: 'Minimal',
      version: '1.0.0',
    };

    const plugin = new Plugin(manifest, '/path');

    assert.strictEqual(plugin.description, '');
    assert.strictEqual(plugin.author, 'Unknown');
    assert.deepStrictEqual(plugin.dependencies, []);
    assert.deepStrictEqual(plugin.hooks, {});
  });

  test('isEnabled should return correct state', () => {
    const manifest = { id: 'test', name: 'Test', version: '1.0.0' };
    const plugin = new Plugin(manifest, '/path');

    assert.ok(!plugin.isEnabled());

    plugin.state = PLUGIN_STATES.ENABLED;
    assert.ok(plugin.isEnabled());
  });

  test('isLoaded should return correct state', () => {
    const manifest = { id: 'test', name: 'Test', version: '1.0.0' };
    const plugin = new Plugin(manifest, '/path');

    assert.ok(!plugin.isLoaded());

    plugin.state = PLUGIN_STATES.LOADED;
    assert.ok(plugin.isLoaded());
  });

  test('toJSON should serialize plugin info', () => {
    const manifest = {
      id: 'test',
      name: 'Test',
      version: '1.0.0',
      hooks: { beforeCycle: 'handler' },
    };
    const plugin = new Plugin(manifest, '/path');
    plugin.state = PLUGIN_STATES.LOADED;
    plugin.loadedAt = '2024-01-01T00:00:00Z';

    const json = plugin.toJSON();

    assert.strictEqual(json.id, 'test');
    assert.strictEqual(json.name, 'Test');
    assert.strictEqual(json.state, PLUGIN_STATES.LOADED);
    assert.deepStrictEqual(json.hooks, ['beforeCycle']);
  });

});

// =============================================================================
// PluginManager Tests
// =============================================================================

describe('PluginManager', () => {

  beforeEach(async () => {
    await setupTestDir();
  });

  afterEach(async () => {
    await cleanupTestDir();
  });

  test('should create manager with defaults', () => {
    const manager = createPluginManager();

    assert.ok(manager);
    assert.strictEqual(manager.initialized, false);
  });

  test('should create manager with custom options', () => {
    const eventBus = createEventBus();
    const manager = createPluginManager({
      pluginsDir: 'custom-plugins',
      eventBus,
    });

    assert.strictEqual(manager.pluginsDir, 'custom-plugins');
    assert.strictEqual(manager.eventBus, eventBus);
  });

  test('should initialize and create plugins directory', async () => {
    const manager = createPluginManager();
    await manager.initialize(testDir);

    assert.ok(manager.initialized);
    assert.ok(await fs.pathExists(path.join(testDir, 'plugins')));
  });

  test('should throw if not initialized', async () => {
    const manager = createPluginManager();

    await assert.rejects(
      manager.discover(),
      /not initialized/
    );
  });

  test('should discover plugins in directory', async () => {
    const manager = createPluginManager();
    await manager.initialize(testDir);

    await createTestPlugin('plugin-a');
    await createTestPlugin('plugin-b');

    const discovered = await manager.discover();

    assert.strictEqual(discovered.length, 2);
    assert.ok(discovered.includes('plugin-a'));
    assert.ok(discovered.includes('plugin-b'));
  });

  test('should validate plugin manifest', () => {
    const manager = createPluginManager();

    // Valid manifest
    assert.ok(manager.validateManifest({
      id: 'valid-plugin',
      name: 'Valid Plugin',
      version: '1.0.0',
    }));

    // Invalid - no id
    assert.ok(!manager.validateManifest({
      name: 'No ID',
      version: '1.0.0',
    }));

    // Invalid - bad id
    assert.ok(!manager.validateManifest({
      id: 'invalid id with spaces',
      name: 'Bad ID',
      version: '1.0.0',
    }));
  });

  test('should load plugin', async () => {
    const manager = createPluginManager();
    await manager.initialize(testDir);
    await createTestPlugin('my-plugin');

    const plugin = await manager.load('my-plugin');

    assert.strictEqual(plugin.id, 'my-plugin');
    assert.strictEqual(plugin.state, PLUGIN_STATES.LOADED);
    assert.ok(manager.has('my-plugin'));
  });

  test('should throw on invalid plugin id', async () => {
    const manager = createPluginManager();
    await manager.initialize(testDir);

    await assert.rejects(
      manager.load('invalid id'),
      /Invalid plugin ID/
    );
  });

  test('should throw on missing plugin', async () => {
    const manager = createPluginManager();
    await manager.initialize(testDir);

    await assert.rejects(
      manager.load('nonexistent'),
      /Plugin not found/
    );
  });

  test('should not load plugin twice', async () => {
    const manager = createPluginManager();
    await manager.initialize(testDir);
    await createTestPlugin('once-plugin');

    const first = await manager.load('once-plugin');
    const second = await manager.load('once-plugin');

    assert.strictEqual(first, second);
  });

  test('should unload plugin', async () => {
    const manager = createPluginManager();
    await manager.initialize(testDir);
    await createTestPlugin('unload-me');

    await manager.load('unload-me');
    assert.ok(manager.has('unload-me'));

    await manager.unload('unload-me');
    assert.ok(!manager.has('unload-me'));
  });

  test('should enable plugin', async () => {
    const manager = createPluginManager();
    await manager.initialize(testDir);
    await createTestPlugin('enable-me');

    await manager.load('enable-me');
    await manager.enable('enable-me');

    const plugin = manager.get('enable-me');
    assert.strictEqual(plugin.state, PLUGIN_STATES.ENABLED);
  });

  test('should disable plugin', async () => {
    const manager = createPluginManager();
    await manager.initialize(testDir);
    await createTestPlugin('disable-me');

    await manager.load('disable-me');
    await manager.enable('disable-me');
    await manager.disable('disable-me');

    const plugin = manager.get('disable-me');
    assert.strictEqual(plugin.state, PLUGIN_STATES.DISABLED);
  });

  test('should get all plugins', async () => {
    const manager = createPluginManager();
    await manager.initialize(testDir);
    await createTestPlugin('plugin-1');
    await createTestPlugin('plugin-2');

    await manager.load('plugin-1');
    await manager.load('plugin-2');

    const all = manager.getAll();
    assert.strictEqual(all.length, 2);
  });

  test('should count enabled plugins', async () => {
    const manager = createPluginManager();
    await manager.initialize(testDir);
    await createTestPlugin('p1');
    await createTestPlugin('p2');

    await manager.load('p1');
    await manager.load('p2');
    await manager.enable('p1');

    assert.strictEqual(manager.enabledCount(), 1);
  });

  test('should load all discovered plugins', async () => {
    const manager = createPluginManager();
    await manager.initialize(testDir);
    await createTestPlugin('auto-1');
    await createTestPlugin('auto-2');

    const loaded = await manager.loadAll();

    assert.strictEqual(loaded.length, 2);
    assert.ok(manager.has('auto-1'));
    assert.ok(manager.has('auto-2'));
  });

  test('should get status', async () => {
    const manager = createPluginManager();
    await manager.initialize(testDir);
    await createTestPlugin('status-plugin');
    await manager.load('status-plugin');
    await manager.enable('status-plugin');

    const status = manager.getStatus();

    assert.ok(status.initialized);
    assert.strictEqual(status.total, 1);
    assert.strictEqual(status.enabled, 1);
    assert.strictEqual(status.plugins.length, 1);
  });

});

// =============================================================================
// Hook Tests
// =============================================================================

describe('Plugin Hooks', () => {

  beforeEach(async () => {
    await setupTestDir();
  });

  afterEach(async () => {
    await cleanupTestDir();
  });

  test('should initialize hook containers', () => {
    const manager = createPluginManager();

    for (const hookType of Object.values(HOOK_TYPES)) {
      assert.ok(manager.hooks.has(hookType));
    }
  });

  test('should execute hooks with context', async () => {
    const manager = createPluginManager();
    await manager.initialize(testDir);

    // Manually add a hook for testing
    manager.hooks.get(HOOK_TYPES.BEFORE_CYCLE).push({
      pluginId: 'test',
      handler: (ctx) => ({ ...ctx, modified: true }),
      priority: 0,
    });

    // Simulate an enabled plugin
    manager.plugins.set('test', new Plugin({
      id: 'test',
      name: 'Test',
      version: '1.0.0',
    }, '/path'));
    manager.plugins.get('test').state = PLUGIN_STATES.ENABLED;

    const result = await manager.executeHooks(HOOK_TYPES.BEFORE_CYCLE, { original: true });

    assert.ok(result.original);
    assert.ok(result.modified);
  });

  test('should execute hooks in priority order', async () => {
    const manager = createPluginManager();
    await manager.initialize(testDir);
    const order = [];

    // Add hooks with different priorities
    manager.hooks.get(HOOK_TYPES.BEFORE_CYCLE).push(
      { pluginId: 'low', handler: () => { order.push('low'); }, priority: 0 },
      { pluginId: 'high', handler: () => { order.push('high'); }, priority: 10 },
      { pluginId: 'mid', handler: () => { order.push('mid'); }, priority: 5 }
    );

    // Sort hooks (normally done in registerPluginHooks)
    manager.hooks.get(HOOK_TYPES.BEFORE_CYCLE).sort((a, b) => b.priority - a.priority);

    // Enable all plugins
    for (const id of ['low', 'high', 'mid']) {
      const plugin = new Plugin({ id, name: id, version: '1.0.0' }, '/path');
      plugin.state = PLUGIN_STATES.ENABLED;
      manager.plugins.set(id, plugin);
    }

    await manager.executeHooks(HOOK_TYPES.BEFORE_CYCLE, {});

    assert.deepStrictEqual(order, ['high', 'mid', 'low']);
  });

  test('should skip hooks for disabled plugins', async () => {
    const manager = createPluginManager();
    await manager.initialize(testDir);
    let called = false;

    manager.hooks.get(HOOK_TYPES.BEFORE_CYCLE).push({
      pluginId: 'disabled',
      handler: () => { called = true; },
      priority: 0,
    });

    // Plugin is loaded but not enabled
    const plugin = new Plugin({ id: 'disabled', name: 'Disabled', version: '1.0.0' }, '/path');
    plugin.state = PLUGIN_STATES.LOADED;
    manager.plugins.set('disabled', plugin);

    await manager.executeHooks(HOOK_TYPES.BEFORE_CYCLE, {});

    assert.ok(!called);
  });

  test('should handle hook errors gracefully', async () => {
    const manager = createPluginManager({ eventBus: createEventBus() });
    await manager.initialize(testDir);
    let secondCalled = false;

    manager.hooks.get(HOOK_TYPES.BEFORE_CYCLE).push(
      { pluginId: 'error', handler: () => { throw new Error('fail'); }, priority: 10 },
      { pluginId: 'success', handler: () => { secondCalled = true; }, priority: 0 }
    );

    for (const id of ['error', 'success']) {
      const plugin = new Plugin({ id, name: id, version: '1.0.0' }, '/path');
      plugin.state = PLUGIN_STATES.ENABLED;
      manager.plugins.set(id, plugin);
    }

    await manager.executeHooks(HOOK_TYPES.BEFORE_CYCLE, {});

    assert.ok(secondCalled, 'Second hook should still execute');
  });

});

// =============================================================================
// Constants Tests
// =============================================================================

describe('Plugin Constants', () => {

  test('PLUGIN_STATES should have all states', () => {
    assert.ok(PLUGIN_STATES.UNLOADED);
    assert.ok(PLUGIN_STATES.LOADED);
    assert.ok(PLUGIN_STATES.ENABLED);
    assert.ok(PLUGIN_STATES.DISABLED);
    assert.ok(PLUGIN_STATES.ERROR);
  });

  test('HOOK_TYPES should have all hooks', () => {
    assert.ok(HOOK_TYPES.BEFORE_CYCLE);
    assert.ok(HOOK_TYPES.AFTER_CYCLE);
    assert.ok(HOOK_TYPES.BEFORE_TASK);
    assert.ok(HOOK_TYPES.AFTER_TASK);
    assert.ok(HOOK_TYPES.ON_TRIGGER);
    assert.ok(HOOK_TYPES.ON_ERROR);
  });

});
